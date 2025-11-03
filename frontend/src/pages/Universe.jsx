import React, { useRef, useState, useEffect, Suspense } from 'react';
// 💡 [오류 1 수정] .jsx 확장자 "제거"
import { useAuth } from '../context/AuthContext'; 
import { Canvas, useFrame } from '@react-three/fiber';
// 💡 [수정] "항상 카메라를 보는" <Billboard /> 훅 추가!
import { OrbitControls, Stars, Text, Html, useTexture, Plane, Sphere, Torus, useVideoTexture, Billboard } from '@react-three/drei';
// 💡 [오류 2 원인] 이 라이브러리가 "설치"되지 않았습니다.
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// =============================================================
// 💡 [Phase 2-B] "어색함" 수정 (1차)
// - 1. [조명 수정] <ambientLight>를 낮추고, <Star>가 <pointLight>를 뿜도록 수정
// - 2. [가짜 3D 수정] <Galaxy>가 <Plane>(평면) 대신 <Billboard>(카메라 응시)를 쓰도록 수정
// =============================================================

// -------------------------------------------------------------
// 3D 천체 컴포넌트들
// -------------------------------------------------------------

/** 🪐 행성 (Planet) 컴포넌트 */
function Planet({ data, position }) {
  const meshRef = useRef();
  const texture = useTexture(data.imageUrl || '/textures/planet_default.jpg');
  
  const isSaturn = data.name.toLowerCase().includes('saturn');

  useFrame((state, delta) => {
    if (meshRef.current) {
        meshRef.current.rotation.y += delta * 0.1; 
    }
  });

  const handleClick = () => {
    alert(`행성 클릭: ${data.name} (소유주: ${data.owner?.username || '없음'})`);
  };

  return (
    <group position={position} onClick={handleClick}>
      <Sphere ref={meshRef} args={[1.5, 32, 32]}>
        {/* 💡 [조명 수정] 
            이제 meshStandardMaterial이 "태양"의 <pointLight>에 반응하여
            "밝은 면"과 "어두운 면(그림자)"이 생깁니다!
        */}
        <meshStandardMaterial map={texture} />
      </Sphere>
      {isSaturn && <SaturnRings />}
      <Text position={[0, -2.5, 0]} fontSize={0.4} color="white" anchorX="center">
        {data.name}
      </Text>
    </group>
  );
}

/** * 💡 [신규] 토성의 "고리" 전용 컴포넌트
 */
function SaturnRings() {
  const texture = useTexture('/textures/saturn_ring.png');
  return (
    <Plane args={[8, 8]} rotation={[Math.PI / 2.5, 0, 0]}>
      <meshBasicMaterial 
        map={texture} 
        transparent={true} 
        side={THREE.DoubleSide} 
      />
    </Plane>
  );
}

/** ⭐ 항성 (Star) 컴포넌트 - 💡 [조명 수정] */
function Star({ data, position }) {
  const texture = useTexture(data.imageUrl || '/textures/sun.jpg'); 
  return (
    <group position={position}>
      <Sphere args={[2.5, 32, 32]}>
        <meshStandardMaterial map={texture} emissive="yellow" emissiveIntensity={2} />
      </Sphere>
      
      {/* 💡 [조명 수정] "진짜" 조명 추가!
          이 항성이 주변의 다른 천체들(행성)을 비추도록 "전구"를 설치합니다.
          intensity={200} (빛의 세기), distance={100} (빛의 도달 거리)
      */}
      <pointLight intensity={300} distance={500} color="#FFD700" />

      <Text position={[0, -3, 0]} fontSize={0.4} color="yellow" anchorX="center">
        {data.name}
      </Text>
    </group>
  );
}

/** 🌀 블랙홀 (Blackhole) 컴포넌트 */
function Blackhole({ data, position }) {
  const diskRef = useRef();
  const texture = useVideoTexture(data.imageUrl || '/textures/blackhole.mp4');
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
      {/* 💡 "가짜 3D" 수정: 블랙홀 원반도 <Billboard>로 감싸서 항상 카메라를 보게 함 */}
      <Billboard>
        <Plane ref={diskRef} args={[8, 8]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial map={texture} transparent={true} side={THREE.DoubleSide} />
        </Plane>
      </Billboard>
      <Text position={[0, -5, 0]} fontSize={0.4} color="red" anchorX="center">
        {data.name}
      </Text>
    </group>
  );
}

/** 🌌 은하 (Galaxy) 컴포넌트 - 💡 [가짜 3D 수정] */
function Galaxy({ data, position }) {
  const texture = useTexture(data.imageUrl || '/textures/galaxy.png'); 
  return (
    // 💡 [가짜 3D 수정] <Plane> 대신 <Billboard> 사용!
    // 이제 이 은하 "사진"은 카메라가 어디로 가든 "항상" 정면을 쳐다봅니다.
    // "종이 쪼가리"처럼 보이는 문제가 90% 해결됩니다.
    <Billboard position={position}>
      <Plane args={[8, 8]}>
        <meshBasicMaterial map={texture} transparent={true} side={THREE.DoubleSide} />
      </Plane>
      <Text position={[0, -5, 0]} fontSize={0.4} color="#00ffff" anchorX="center">
        {data.name}
      </Text>
    </Billboard>
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
          
          {/* 💡 [조명 수정] "병원 형광등"을 끄고, "은은한" 기본 조명만 남김 */}
          <ambientLight intensity={0.1} /> 
          
          <Stars radius={300} depth={50} count={10000} factor={10} saturation={1} fade speed={1} />
          
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

