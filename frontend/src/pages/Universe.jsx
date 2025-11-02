import React, { useRef, useState, useEffect, Suspense } from 'react';
// 💡 [오류 1 수정] .jsx 확장자 "제거" (Vite가 자동으로 찾도록 함)
import { useAuth } from '../context/AuthContext'; 
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Html, useTexture, Plane, Sphere, Torus, useVideoTexture } from '@react-three/drei';
// 💡 [오류 2 원인] 이 라이브러리가 "설치"되지 않았습니다.
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// =============================================================
// 💡 [Phase 2] 3D 우주 공간 (토성 고리 "합체" 기능 추가)
// - 1. `<SaturnRings />` 컴포넌트를 "새로" 만듭니다.
// - 2. `<Planet />` 컴포넌트가 `data.name`을 확인하고,
// - 3. "토성"일 경우에만 `<SaturnRings />`를 렌더링하여 "합체"시킵니다.
// =============================================================

// -------------------------------------------------------------
// 3D 천체 컴포넌트들
// -------------------------------------------------------------

/** * 💡 [신규] 토성의 "고리" 전용 컴포넌트
 */
function SaturnRings() {
  // 💡 [필수!] /public/textures/saturn_ring.png (배경 투명) 파일이 있어야 합니다.
  const texture = useTexture('/textures/saturn_ring.png');
  
  return (
    // 💡 얇은 "판" (Plane)을 90도 눕히고, 텍스처를 씌웁니다.
    <Plane args={[8, 8]} rotation={[Math.PI / 2.5, 0, 0]}>
      <meshBasicMaterial 
        map={texture} 
        transparent={true} // 💡 PNG의 투명한 부분을 "구멍"으로 렌더링 (필수!)
        side={THREE.DoubleSide} // 💡 앞/뒷면 모두 보이게
      />
    </Plane>
  );
}

/** 🪐 행성 (Planet) 컴포넌트 - 💡 "고리" 기능 추가 */
function Planet({ data, position }) {
  const meshRef = useRef();
  const texture = useTexture(data.imageUrl || '/textures/planet_default.jpg');
  
  // 💡 [핵심] 이 행성이 "토성"인지 확인합니다.
  const isSaturn = data.name.toLowerCase().includes('saturn');

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1; // 자전
    }
  });

  const handleClick = () => {
    alert(`행성 클릭: ${data.name} (소유주: ${data.owner?.username || '없음'})`);
  };

  return (
    // 💡 <group>이 "투명 상자" 역할을 합니다. (행성 + 고리 + 텍스트)
    <group position={position} onClick={handleClick}>
      
      {/* 1. 행성 "본체" (찰흙 + 시트지 1) */}
      <Sphere ref={meshRef} args={[1.5, 32, 32]}>
        <meshStandardMaterial map={texture} />
      </Sphere>
      
      {/* 💡 2. "토성"일 경우에만 "고리" 렌더링! (찰흙 2 + 시트지 2) */}
      {isSaturn && <SaturnRings />}

      {/* 3. 행성 이름 */}
      <Text position={[0, -2.5, 0]} fontSize={0.4} color="white" anchorX="center">
        {data.name}
      </Text>
    </group>
  );
}

/** ⭐ 항성 (Star) 컴포넌트 */
function Star({ data, position }) {
  const texture = useTexture('/textures/sun.jpg'); 
  return (
    <group position={position}>
      <Sphere args={[2.5, 32, 32]}>
        <meshStandardMaterial map={texture} emissive="yellow" emissiveIntensity={2} />
      </Sphere>
      <Text position={[0, -3, 0]} fontSize={0.4} color="yellow" anchorX="center">
        {data.name}
      </Text>
    </group>
  );
}

/** 🌀 블랙홀 (Blackhole) 컴포넌트 */
function Blackhole({ data, position }) {
  const diskRef = useRef();
  const texture = useVideoTexture('/textures/blackhole.mp4');
  useFrame((state, delta) => {
    if (diskRef.current) {
        diskRef.current.rotation.z += delta * 0.5; 
    }
  });
  return (
    <group position={position}>
      <Sphere args={[2, 32, 32]}>
        <meshBasicMaterial color="black" />
      </Sphere>
      <Plane ref={diskRef} args={[8, 8]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial map={texture} transparent={true} side={THREE.DoubleSide} />
      </Plane>
      <Text position={[0, -5, 0]} fontSize={0.4} color="red" anchorX="center">
        {data.name}
      </Text>
    </group>
  );
}

/** 🌌 은하 (Galaxy) 컴포넌트 */
function Galaxy({ data, position }) {
  const texture = useTexture('/textures/galaxy.png'); 
  return (
    <Plane args={[8, 8]} position={position}>
      <meshBasicMaterial map={texture} transparent={true} side={THREE.DoubleSide} />
      <Text position={[0, -5, 0]} fontSize={0.4} color="#00ffff" anchorX="center">
        {data.name}
      </Text>
    </Plane>
  );
}


// -------------------------------------------------------------
// [최상위] Universe 페이지
// -------------------------------------------------------------
export default function Universe() {
  const auth = useAuth();
  
  // ... (useState, useEffect fetch 로직은 이전과 100% 동일) ...
  const [galaxies, setGalaxies] = useState([]);
  const [stars, setStars] = useState([]);
  const [planets, setPlanets] = useState([]);
  const [blackholes, setBlackholes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllCelestials = async () => {
      try {
        setIsLoading(true);
        const [galRes, starRes, planetRes, bhRes] = await Promise.all([
          fetch('http://localhost:5000/api/galaxies'),
          fetch('http://localhost:5000/api/stars'),
          fetch('http://localhost:5000/api/planets'),
          fetch('http://localhost:5000/api/blackholes')
        ]);
        if (!galRes.ok || !starRes.ok || !planetRes.ok || !bhRes.ok) {
          throw new Error('데이터 로딩 중 하나 이상의 API가 실패했습니다.');
        }
        setGalaxies(await galRes.json());
        setStars(await starRes.json());
        setPlanets(await planetRes.json());
        setBlackholes(await bhRes.json());
        setError(null);
      } catch (e) {
        console.error("모든 천체 로딩 실패:", e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllCelestials();
  }, []); 

  const getRandomPosition = () => [
    (Math.random() - 0.5) * 100, 
    (Math.random() - 0.5) * 50,  
    (Math.random() - 0.5) * 100  
  ];

  return (
    <div className="w-screen h-screen bg-black text-white relative">
      <Canvas camera={{ position: [0, 0, 50], fov: 75 }}>
        <Suspense fallback={<Html center><div className="text-white text-2xl">Loading...</div></Html>}>
          <ambientLight intensity={1.0} />
          <Stars radius={300} depth={50} count={10000} factor={10} saturation={1} fade speed={1} />
          
          {/* 💡 렌더링 로직은 수정할 필요가 없습니다. 
            `Planet` 컴포넌트가 알아서 "토성"을 구별하고 "고리"를 렌더링합니다!
          */}
          {!isLoading && !error && (
            <>
              {galaxies.map(d => <Galaxy key={d._id} data={d} position={getRandomPosition()} />)}
              {stars.map(d => <Star key={d._id} data={d} position={getRandomPosition()} />)}
              {planets.map(d => <Planet key={d._id} data={d} position={getRandomPosition()} />)}
              {blackholes.map(d => <Blackhole key={d._id} data={d} position={getRandomPosition()} />)}
            </>
          )}

          <OrbitControls />
        </Suspense>

        <EffectComposer>
          <Bloom luminanceThreshold={0.5} intensity={1.5} />
        </EffectComposer>
      </Canvas>

      {/* 2. HTML UI (HUD) */}
      <div className="absolute top-5 left-5 z-10 p-4 bg-black/30 rounded-lg backdrop-blur-sm">
        {auth.user && <p className="text-xl text-cyan-400">환영합니다, {auth.user.username}님!</p>}
        {isLoading && <p className="text-xl text-yellow-300">천체 목록 로딩 중...</p>}
        {error && <p className="text-xl text-red-500">{error}</p>}
      </div>
    </div>
  );
}

