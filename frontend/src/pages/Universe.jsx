import React, { useRef, useState, useEffect, Suspense } from 'react';
// 💡 [오류 1 수정] .jsx 확장자 제거 (Vite가 자동으로 찾도록 함)
import { useAuth } from '../context/AuthContext'; 
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Html, useTexture, Plane, Sphere, Torus } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// =============================================================
// 💡 [Phase 2] 3D 우주 공간 (단일 뷰 - 최종)
// - 1. `NebulaSkybox`로 3D 공간 전체를 덮습니다.
// - 2. `useEffect`가 4개의 API(stars, planets, blackholes, galaxies)를 "동시에" 호출합니다.
// - 3. 모든 천체를 Math.random()을 이용해 3D 공간에 "흩뿌립니다".
// =============================================================

// -------------------------------------------------------------
// 3D 천체 컴포넌트들
// -------------------------------------------------------------

/** 🪐 행성 (Planet) 컴포넌트 */
function Planet({ data, position }) {
  const meshRef = useRef();
  // 💡 백엔드의 `imageUrl` 필드 사용, 없으면 임시 텍스처 로드
  const texture = useTexture(data.imageUrl || '/textures/planet_default.jpg');

  useFrame((state, delta) => {
    if (meshRef.current) {
        meshRef.current.rotation.y += delta * 0.1; // 자전
    }
  });

  const handleClick = () => {
    // 💡 [Phase 3] D-Lab 계획서의 "픽셀 아트" 행성을 클릭했을 때의 로직
    // 예: if (data.name === "Pixelia") { setView('2D_CANVAS'); }
    alert(`행성 클릭: ${data.name} (소유주: ${data.owner?.username || '없음'})`);
  };

  return (
    <group position={position} onClick={handleClick}>
      <Sphere ref={meshRef} args={[1.5, 32, 32]}>
        <meshStandardMaterial map={texture} />
      </Sphere>
      <Text position={[0, -2, 0]} fontSize={0.4} color="white" anchorX="center">
        {data.name}
      </Text>
    </group>
  );
}

/** ⭐ 항성 (Star) 컴포넌트 */
function Star({ data, position }) {
  const texture = useTexture('/textures/star.jpg'); // 💡 public/textures/star.jpg 필요
  
  return (
    <group position={position}>
      <Sphere args={[2.5, 32, 32]}>
        {/* 💡 스스로 빛나는 재질 + Bloom 효과를 위해 emissive(방출) 속성 사용 */}
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
  const texture = useTexture('/textures/disk.png'); // 💡 public/textures/disk.png (원반 모양 텍스처)
  
  useFrame((state, delta) => {
    if (diskRef.current) {
        diskRef.current.rotation.z += delta * 0.5; // 원반 회전
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

/** 🌌 은하 (Galaxy) 컴포넌트 - 2D 이미지로 대체 */
function Galaxy({ data, position }) {
  const texture = useTexture('/textures/galaxy.png'); // 💡 public/textures/galaxy.png
  
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
// [배경] 성운 스카이박스
// -------------------------------------------------------------
function NebulaSkybox() {
  // 💡 public/textures/nebula.jpg (360도 파노라마 성운) 이미지가 필요합니다.
  const texture = useTexture('/textures/nebula.jpg'); 
  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial 
        map={texture} 
        side={THREE.BackSide} // 💡 구체의 "안쪽" 면에 재질을 바름
      />
    </mesh>
  );
}

// -------------------------------------------------------------
// [최상위] Universe 페이지
// -------------------------------------------------------------
export default function Universe() {
  const auth = useAuth();
  
  // 💡 4개의 API에서 받아온 모든 천체 목록
  const [galaxies, setGalaxies] = useState([]);
  const [stars, setStars] = useState([]);
  const [planets, setPlanets] = useState([]);
  const [blackholes, setBlackholes] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 💡 [핵심]
  // 4개의 API를 "동시에" 호출
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
  }, []); // [] : 1번만 실행

  // 3D 씬을 위한 임의의 위치 생성 함수
  const getRandomPosition = () => [
    (Math.random() - 0.5) * 100, // X: -50 ~ +50
    (Math.random() - 0.5) * 50,  // Y: -25 ~ +25
    (Math.random() - 0.5) * 100  // Z: -50 ~ +50
  ];

  return (
    <div className="w-screen h-screen bg-black text-white relative">
      {/* 1. 3D 캔버스 */}
      <Canvas camera={{ position: [0, 0, 50], fov: 75 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={1.0} />
          
          {/* 1. 성운 "벽지" */}
          <NebulaSkybox />
          
          {/* 2. 모든 천체 렌더링 */}
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

        {/* 3. 빛나는 효과 */}
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

