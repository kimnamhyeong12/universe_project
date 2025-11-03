import React, { useRef, useState, useEffect, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Stars,
  Text,
  Html,
  useTexture,
  Plane,
  Sphere,
  useVideoTexture,
  Billboard,
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// 🌀 궤도 라인 (행성 궤도 표시용)
function OrbitLine({ radius }) {
  const points = [];
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <line geometry={geometry}>
      <lineBasicMaterial attach="material" color="white" linewidth={1} />
    </line>
  );
}

/** 🪐 행성 컴포넌트 (공전 + 자전) */
function Planet({ data }) {
  const planetRef = useRef();
  const texture = useTexture(data.imageUrl || '/textures/planet_default.jpg');
  const isSaturn = data.name.toLowerCase().includes('saturn');

  // 공전 반경 및 속도
  const orbitRadius = data.orbitRadius || 10;
  const orbitSpeed = data.orbitSpeed || 0.01;
  const orbitOffset = Math.random() * Math.PI * 2; // 시작 위치 랜덤화

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = orbitOffset + t * orbitSpeed;

    const x = Math.cos(angle) * orbitRadius;
    const z = Math.sin(angle) * orbitRadius;

    if (planetRef.current) {
      planetRef.current.position.set(x, 0, z); // 🌍 공전
      planetRef.current.rotation.y += 0.01; // 🌎 자전
    }
  });

  const handleClick = () => {
    alert(`행성 클릭: ${data.name} (소유주: ${data.owner?.username || '없음'})`);
  };

  return (
    <group onClick={handleClick}>
      <OrbitLine radius={orbitRadius} />
      <group ref={planetRef}>
        <Sphere args={[1.5, 32, 32]}>
          <meshStandardMaterial map={texture} />
        </Sphere>
        {isSaturn && <SaturnRings />}
        <Text position={[0, -2.5, 0]} fontSize={0.4} color="white" anchorX="center">
          {data.name}
        </Text>
      </group>
    </group>
  );
}

/** 🪐 토성 고리 전용 */
function SaturnRings() {
  const texture = useTexture('/textures/saturn_ring.png');
  return (
    <Plane args={[8, 8]} rotation={[Math.PI / 2.5, 0, 0]}>
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </Plane>
  );
}

/** ☀️ 태양 (항성, 중심 고정) */
function Star({ data }) {
  const texture = useTexture(data.imageUrl || '/textures/sun.jpg');
  return (
    <group position={[0, 0, 0]}>
      <Sphere args={[2.5, 32, 32]}>
        <meshStandardMaterial map={texture} emissive="yellow" emissiveIntensity={2.5} />
      </Sphere>
      <pointLight intensity={350} distance={500} color="#FFD700" />
      <Text position={[0, -3, 0]} fontSize={0.4} color="yellow" anchorX="center">
        {data.name}
      </Text>
    </group>
  );
}

/** 🌀 블랙홀 */
function Blackhole({ data, position }) {
  const diskRef = useRef();
  const texture = useVideoTexture(data.imageUrl || '/textures/blackhole.mp4');

  useFrame((_, delta) => {
    if (diskRef.current) diskRef.current.rotation.z += delta * 0.5;
  });

  return (
    <group position={position}>
      <Sphere args={[2, 32, 32]}>
        <meshBasicMaterial color="black" />
      </Sphere>
      <Billboard>
        <Plane ref={diskRef} args={[8, 8]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
        </Plane>
      </Billboard>
      <Text position={[0, -5, 0]} fontSize={0.4} color="red" anchorX="center">
        {data.name}
      </Text>
    </group>
  );
}

/** 🌌 은하 (Billboard 형태) */
function Galaxy({ data, position }) {
  const texture = useTexture(data.imageUrl || '/textures/galaxy.png');
  return (
    <Billboard position={position}>
      <Plane args={[8, 8]}>
        <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
      </Plane>
      <Text position={[0, -5, 0]} fontSize={0.4} color="#00ffff" anchorX="center">
        {data.name}
      </Text>
    </Billboard>
  );
}

// =============================================================
// 🌠 Universe Main Component
// =============================================================
export default function Universe() {
  const auth = useAuth();
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
          fetch('http://localhost:5000/api/blackholes'),
        ]);
        if (!galRes.ok || !starRes.ok || !planetRes.ok || !bhRes.ok) throw new Error('데이터 로딩 실패');

        setGalaxies(await galRes.json());
        setStars(await starRes.json());
        setPlanets(await planetRes.json());
        setBlackholes(await bhRes.json());
      } catch (e) {
        console.error("❌ 천체 데이터 로딩 오류:", e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllCelestials();
  }, []);

  // 🎯 은하 & 블랙홀은 보일 정도로만 랜덤 배치
  const getVisiblePosition = () => [
    (Math.random() - 0.5) * 100 + 80,
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 100 + 80,
  ];

  return (
    <div className="w-screen h-screen bg-black text-white relative">
      <Canvas camera={{ position: [0, 0, 60], fov: 75 }}>
        <Suspense fallback={<Html center><div className="text-white text-2xl">Loading...</div></Html>}>
          <ambientLight intensity={0.15} />
          <Stars radius={300} depth={50} count={10000} factor={10} saturation={1} fade speed={1} />

          {!isLoading && !error && (
            <>
              {galaxies.map(d => <Galaxy key={d._id} data={d} position={getVisiblePosition()} />)}
              {stars.map(d => <Star key={d._id} data={d} />)}
              {planets.map(d => <Planet key={d._id} data={d} />)}
              {blackholes.map(d => <Blackhole key={d._id} data={d} position={getVisiblePosition()} />)}
            </>
          )}

          <OrbitControls />
        </Suspense>

        <EffectComposer>
          <Bloom luminanceThreshold={0.5} intensity={1.2} />
        </EffectComposer>
      </Canvas>

      {/* HUD */}
      <div className="absolute top-5 left-5 z-10 p-4 bg-black/30 rounded-lg backdrop-blur-sm">
        {auth.user && <p className="text-xl text-cyan-400">환영합니다, {auth.user.username}님!</p>}
        {isLoading && <p className="text-xl text-yellow-300">천체 목록 로딩 중...</p>}
        {error && <p className="text-xl text-red-500">{error}</p>}
      </div>
    </div>
  );
}
