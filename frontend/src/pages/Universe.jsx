import React, { useRef, useState, useEffect, Suspense } from 'react';
// 💡 [오류 1 수정] .jsx 확장자 제거 (Vite가 자동으로 찾도록 함)
import { useAuth } from '../context/AuthContext'; 
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Html, useTexture, Plane } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// =============================================================
// 💡 [Phase 2] 3D 우주 공간 (줌인 기능 포함)
// - 1. "유니버스 뷰" (Level 1): `GET /api/galaxies`를 호출해 은하 목록을 띄웁니다.
// - 2. "갤럭시 뷰" (Level 2): 은하 클릭 시, 줌인하며 `GET /api/stars` 등을 호출합니다.
// =============================================================

// -------------------------------------------------------------
// [Level 1] 유니버스 뷰 컴포넌트
// -------------------------------------------------------------

/**
 * [Level 1] 은하 하나를 렌더링 (임시로 평면 이미지 사용)
 */
function Galaxy({ galaxyData, onSelect }) {
  const meshRef = useRef();
  // 임시 은하 이미지 로드 (public/textures/galaxy.png가 있다고 가정)
  // 💡 public/textures/ 폴더에 galaxy.png 파일을 넣어두어야 합니다!
  const texture = useLoader(THREE.TextureLoader, '/textures/galaxy.png');

  useFrame((state, delta) => {
    if(meshRef.current) {
        meshRef.current.rotation.z += delta * 0.1; // 천천히 회전
    }
  });

  return (
    <Plane 
      ref={meshRef}
      args={[5, 5]} // 5x5 크기의 평면
      position={galaxyData.position}
      onClick={() => onSelect(galaxyData)}
    >
      <meshBasicMaterial 
        map={texture}
        transparent={true} // PNG 배경 투명 처리
        side={THREE.DoubleSide}
      />
      <Text position={[0, -3, 0]} fontSize={0.5} color="white">
        {galaxyData.name}
      </Text>
    </Plane>
  );
}

/**
 * [Level 1] 모든 은하 목록을 API로 불러와 렌더링
 */
function UniverseView({ onGalaxyClick }) {
  const [galaxies, setGalaxies] = useState(null); // null: 로딩 중
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGalaxies = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/galaxies');
        if (!res.ok) throw new Error('은하계 API 호출 실패');
        const data = await res.json();
        
        // 💡 3D 씬을 위해 데이터 가공 (임시 위치 지정)
        const processedData = data.map((gal, index) => ({
          ...gal,
          position: [Math.random() * 40 - 20, Math.random() * 20 - 10, -Math.random() * 30]
        }));
        setGalaxies(processedData);

      } catch (e) {
        console.error("Failed to fetch galaxies:", e);
        setError(e.message);
      }
    };
    fetchGalaxies();
  }, []);

  if (galaxies === null) {
    return <Html center><div className="text-white text-lg">Loading Universes...</div></Html>;
  }
  if (error) {
    return <Html center><div className="text-red-500 text-lg">{error}</div></Html>;
  }

  return (
    <group>
      {galaxies.map(gal => (
        <Galaxy key={gal._id} galaxyData={gal} onSelect={onGalaxyClick} />
      ))}
    </group>
  );
}


// -------------------------------------------------------------
// [Level 2] 갤럭시 뷰 컴포넌트 (줌인 후)
// -------------------------------------------------------------

/**
 * [Level 2] 은하 내부의 천체(항성, 행성, 블랙홀) 렌더링
 */
function GalaxyView({ galaxy }) {
  const [stars, setStars] = useState(null);
  const [planets, setPlanets] = useState(null);
  const [blackholes, setBlackholes] = useState(null);
  const [error, setError] = useState(null);

  // 💡 [핵심]
  // 은하(galaxy) ID가 바뀌면, 3개의 API를 "동시에" 호출
  useEffect(() => {
    if (!galaxy) return;

    // 뷰가 전환될 때 이전 데이터를 초기화 (로딩 표시를 위함)
    setStars(null);
    setPlanets(null);
    setBlackholes(null);
    setError(null);

    const fetchGalaxyContents = async () => {
      try {
        // 3개의 API를 병렬로 호출
        const [starRes, planetRes, blackholeRes] = await Promise.all([
          fetch(`http://localhost:5000/api/stars?galaxy=${galaxy._id}`),
          fetch(`http://localhost:5000/api/planets?galaxy=${galaxy._id}`), // 💡 1순위: 팀장님이 이 API를 수정해줘야 함!
          fetch(`http://localhost:5000/api/blackholes?galaxy=${galaxy._id}`)
        ]);
        
        if (!starRes.ok || !planetRes.ok || !blackholeRes.ok) {
            throw new Error('은하 내부 API 호출 중 하나가 실패했습니다.');
        }

        setStars(await starRes.json());
        setPlanets(await planetRes.json());
        setBlackholes(await blackholeRes.json());

      } catch (e) {
        console.error("은하 내부 로딩 실패:", e);
        setError(e.message);
      }
    };
    
    fetchGalaxyContents();
  }, [galaxy]); // galaxy가 바뀔 때마다 재실행

  // ------------------------------------------
  // 💡 (임시 렌더링)
  // 여기서는 간단히 텍스트로 갯수만 표시합니다.
  // 실제로는 이 데이터를 .map()으로 돌려 3D 모델(<Planet>, <Star>...)을 렌더링해야 합니다.
  // ------------------------------------------
  return (
    <Html position={[-10, 10, 0]}>
      <div className="text-white bg-black/50 p-4 rounded-lg w-64 backdrop-blur-sm">
        <h2 className="text-2xl text-cyan-400">{galaxy.name}</h2>
        <p className="text-sm opacity-80">{galaxy.description || '은하 설명 로딩 중...'}</p>
        <hr className="my-2 border-gray-600" />
        
        {error && <p className="text-red-400">{error}</p>}
        
        <p>항성 갯수: {stars ? `${stars.length} 개` : '로딩 중...'}</p>
        <p>행성 갯수: {planets ? `${planets.length} 개` : '로딩 중...'}</p>
        <p>블랙홀 갯수: {blackholes ? `${blackholes.length} 개` : '로딩 중...'}</p>
      </div>
    </Html>
  );
}


// -------------------------------------------------------------
// [최상위] Universe 페이지 (뷰 전환 담당)
// -------------------------------------------------------------

export default function Universe() {
  const auth = useAuth();
  // 💡 [상태]
  // null: 유니버스 뷰 (Level 1)
  // galaxy 객체: 갤럭시 뷰 (Level 2)
  const [selectedGalaxy, setSelectedGalaxy] = useState(null); 

  // 💡 [줌인 로직]
  // 카메라 컨트롤을 저장할 ref
  const controlsRef = useRef();

  useEffect(() => {
    if (selectedGalaxy) {
      // 💡 "갤럭시 뷰"로 줌인 (카메라를 은하의 위치로 이동)
      controlsRef.current?.setLookAt(
        ...selectedGalaxy.position.map(p => p + 10), // 카메라 위치 (은하 옆)
        ...selectedGalaxy.position, // 바라볼 대상 (은하)
        true // 부드러운 이동
      );
      console.log("줌인 실행:", selectedGalaxy.name);
      
    } else {
      // 💡 "유니버스 뷰"로 줌 아웃 (카메라를 기본 위치로 복귀)
      controlsRef.current?.setLookAt(0, 5, 50, 0, 0, 0, true);
      console.log("줌 아웃 실행: 유니버스 뷰로 복귀");
    }
  }, [selectedGalaxy]); // selectedGalaxy가 바뀔 때마다 실행

  return (
    <div className="w-screen h-screen bg-black text-white relative">
      {/* 1. 3D 캔버스 */}
      <Canvas camera={{ position: [0, 5, 50], fov: 75 }}>
        <Suspense fallback={
          <Html center><div className="text-white text-2xl">Loading...</div></Html>
        }>
          <ambientLight intensity={1.5} />
          <Stars radius={300} depth={50} count={10000} factor={10} saturation={1} fade speed={1} />
          
          {/* 💡 [뷰 전환]
              selectedGalaxy가 있으면 "갤럭시 뷰"를, 없으면 "유니버스 뷰"를 렌더링
          */}
          {selectedGalaxy ? (
            <GalaxyView galaxy={selectedGalaxy} />
          ) : (
            <UniverseView onGalaxyClick={setSelectedGalaxy} />
          )}

          {/* 💡 [오류 2 해결]
            이 컴포넌트가 작동하려면,
            npm install @react-three/drei
            가 "반드시" 설치되어 있어야 합니다.
          */}
          <OrbitControls ref={controlsRef} makeDefault />
        </Suspense>

        {/* 💡 [오류 2 해결]
          이 컴포넌트가 작동하려면,
          npm install @react-three/postprocessing
          가 "반드시" 설치되어 있어야 합니다.
        */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.3} intensity={1.5} />
        </EffectComposer>
      </Canvas>

      {/* 2. HTML UI (HUD) */}
      <div className="absolute top-5 left-5 z-10 p-4 bg-black/30 rounded-lg backdrop-blur-sm">
        {auth.user && <p className="text-xl text-cyan-400">환영합니다, {auth.user.username}님!</p>}
      </div>
      
      {/* 💡 [줌 아웃 버튼]
          "갤럭시 뷰"일 때만 "뒤로 가기" 버튼 표시
      */}
      {selectedGalaxy && (
        <button 
          className="absolute top-5 right-5 z-10 p-2 px-4 bg-cyan-500/50 rounded-lg text-white hover:bg-cyan-500 transition-colors"
          onClick={() => setSelectedGalaxy(null)} // 💡 상태를 null로 바꿔서 줌 아웃
        >
          &larr; 뒤로 (유니버스 뷰)
        </button>
      )}
    </div>
  );
}

