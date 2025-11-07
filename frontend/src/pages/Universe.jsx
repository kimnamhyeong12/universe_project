// src/pages/Universe.jsx
import React, { useRef, useState, useEffect, Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Stars, Text, Html, useTexture, Plane, Sphere, CameraControls,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import "../styles/celestia-styles.css";
import PurchasePanel from "../components/PurchasePanel";
import { useNavigate } from "react-router-dom";

/* ----------------------------- HUD ----------------------------- */
function HUD({ username }) {
  // ... (이하 동일)
  return (
    <div className="absolute top-4 left-4 z-30">
      <div className="cel-hud card-glass px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/60 to-indigo-500/60 shadow-lg shadow-cyan-500/30" />
          <div>
            <div className="text-cyan-300 font-bold tracking-wide text-lg">
              환영합니다, {username}님!
            </div>
            <div className="text-xs text-cyan-200/70">
              SECTOR: ORION · VISUAL MODE: ULTRA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Orbit Line ----------------------------- */
function OrbitLine({ radius }) {
  // ... (이하 동일)
  const pts = [];
  const seg = 128;
  for (let i = 0; i <= seg; i++) {
    const t = (i / seg) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
  }
  const geom = new THREE.BufferGeometry().setFromPoints(pts);
  return (
    <line geometry={geom}>
      <lineBasicMaterial attach="material" color="white" linewidth={1} />
    </line>
  );
}

/* ----------------------------- Saturn Rings ----------------------------- */
function SaturnRings() {
  // ... (이하 동일)
  const texture = useTexture("/textures/saturn_ring.png");
  return (
    <Plane args={[8, 8]} rotation={[Math.PI / 2.5, 0, 0]}>
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </Plane>
  );
}

/* ----------------------------- Planet (공전 정지 + 자전 유지) ----------------------------- */
function Planet({ data, onSelect, freezeOrbit = false }) {
  // ... (이하 동일)
  const ORBIT_MULT = 2.5;
  const SPIN_MULT = 1.4;

  const planetRef = useRef();
  const texture = useTexture(data.imageUrl || "/textures/planet_default.jpg");

  const angleRef = useRef(Math.random() * Math.PI * 2);
  const orbitRadius = data.orbitRadius || 20 + Math.random() * 10;
  const orbitSpeed = data.orbitSpeed || 2.5;
  const spinSpeed = 1.7;

  useFrame((_, delta) => {
    if (!freezeOrbit) angleRef.current += orbitSpeed * ORBIT_MULT * delta;
    const x = Math.cos(angleRef.current) * orbitRadius;
    const z = Math.sin(angleRef.current) * orbitRadius;

    if (planetRef.current) {
      planetRef.current.position.set(x, 0, z);
      planetRef.current.rotation.y += spinSpeed * SPIN_MULT * delta;
    }
  });

  const handleClick = () => {
    const world = new THREE.Vector3();
    planetRef.current?.getWorldPosition(world);
    onSelect({
      ...data,
      type: "planet",
      positionRef: planetRef,
      worldPos: world.clone(),
    });
  };

  const isSaturn = (data.name || "").toLowerCase().includes("saturn");

  return (
    <group onClick={handleClick}>
      <OrbitLine radius={orbitRadius} />
      <group ref={planetRef}>
        <Sphere args={[1.5, 32, 32]}>
          <meshStandardMaterial map={texture} />
        </Sphere>
        {isSaturn && <SaturnRings />}
        <Text
          position={[0, -2.3, 0]}
          fontSize={0.45}
          color="white"
          anchorX="center"
        >
          {data.name}
        </Text>
      </group>
    </group>
  );
}

/* ----------------------------- Star ----------------------------- */
function Star({ data, position = [0, 0, 0], onSelect }) {
  // ... (이하 동일)
  const texture = useTexture(data.imageUrl || "/textures/sun.jpg");
  return (
    <group
      position={position}
      onClick={() =>
        onSelect({
          ...data,
          type: "star",
          worldPos: new THREE.Vector3(...position),
        })
      }
    >
      <Sphere args={[3, 32, 32]}>
        <meshStandardMaterial
          map={texture}
          emissive="yellow"
          emissiveIntensity={2.5}
        />
      </Sphere>
      <pointLight intensity={400} distance={600} color="#FFD700" />
      <Text
        position={[0, -3.2, 0]}
        fontSize={0.5}
        color="yellow"
        anchorX="center"
      >
        {data.name}
      </Text>
    </group>
  );
}

/* ----------------------------- Small UI ----------------------------- */
function Thumb({ url }) {
  // ... (이하 동일)
  return <div className="thumb" style={{ backgroundImage: `url(${url})` }} />;
}
function InfoBox({ label, value }) {
  // ... (이하 동일)
  return (
    <div className="bg-white/5 rounded-md px-4 py-3 border border-white/10 flex items-center justify-between">
      <span className="text-cyan-200/80 text-sm md:text-base">{label}</span>
      <span className="text-cyan-100 font-semibold text-base md:text-lg">
        {value}
      </span>
    </div>
  );
}

/* ----------------------------- ObjectPanel (✅ 수정됨) ----------------------------- */
function ObjectPanel({ data, onClose, onOpenDetail, onBuy }) {
  const isStar = data.type === "star";
  const navigate = useNavigate();

  // ✅ 수정된 구매 이동 함수
  const handlePurchase = () => {
    navigate("/market", {
      state: {
        asset: {
          _id: data._id,
          name: data.name,
          type: data.type || "Planet",
          price: data.price || 1000,
          imageUrl: data.imageUrl || "/textures/planet_default.jpg",
        },
      },
    });
  };

  return (
    <div className="absolute left-8 md:left-10 z-20 top-28 md:top-32">
      <div className="card-glass panel-tall panel-narrow w-[360px] sm:w-[380px] md:w-[400px] p-6 md:p-7">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-amber-400/70 to-yellow-200/50 shadow-[0_0_30px_-5px_rgba(255,200,0,0.8)]" />
          <div>
            <div className="text-[28px] md:text-[32px] font-extrabold text-white drop-shadow">
              {data.name}
            </div>
            <div className="text-sm text-cyan-200/70">
              {isStar ? "항성" : data.type}
            </div>
          </div>
        </div>

        {/* ✅ [수정] 인포 박스 4줄 대신 이미지 추가 */}
        <div className="mt-4">
          <img
            src={data.imageUrl || "/textures/planet_default.jpg"}
            alt={data.name}
            className="panel-planet-image" 
          />
        </div>

        {/* 액션 (유지) */}
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn-neo btn-neo--lg" onClick={onOpenDetail}>
            정보 보기
          </button>
          <button className="btn-neo btn-neo--lg" onClick={handlePurchase}>
            구매하기
          </button>
          <button
            className="btn-neo btn-neo--lg"
            onClick={() => navigate(`/view/${data.name}`)}
          >
            구경하기
          </button>
        </div>

        {/* 푸터 */}
        <div className="mt-4 flex items-center justify-between text-xs text-cyan-200/70">
          <span>VER. 3.2 · HYPERDRIVE</span>
          <button className="hover:text-white transition" onClick={onClose}>
            닫기 ✖
          </button>
        </div>
      </div>
    </div>
  );
}


/* ----------------------------- DetailSlide (✅ 수정됨) ----------------------------- */
function DetailSlide({ open, data, onClose }) {
  const [tab, setTab] = useState("info");
  const posText = data?.worldPos
    ? `${data.worldPos.x.toFixed(1)}, ${data.worldPos.y.toFixed(1)}, ${data.worldPos.z.toFixed(1)}`
    : "-";

  return (
    <div className={`detail-wrap ${open ? "open" : ""}`}>
      <div className="detail-panel card-glass">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-cyan-200/70 uppercase tracking-widest">
              detail view
            </div>
            <div className="text-2xl font-extrabold text-white drop-shadow">
              {data?.name || "-"}
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            닫기 ✖
          </button>
        </div>

        {/* 탭 (유지) */}
        <div className="tabs mt-5">
          <button className={`tab ${tab === "info" ? "active" : ""}`} onClick={() => setTab("info")}>정보</button>
          <button className={`tab ${tab === "images" ? "active" : ""}`} onClick={() => setTab("images")}>이미지</button>
          <button className={`tab ${tab === "inner" ? "active" : ""}`} onClick={() => setTab("inner")}>내부구조</button>
        </div>

        {/* 탭 콘텐츠 (유지) */}
        <div className="mt-5 min-h-[340px]">
          {tab === "info" && (
            <div className="space-y-4 text-cyan-100/90">
              <p className="leading-relaxed">{data?.description || "이 천체에 대한 설명이 준비 중입니다."}</p>
              <div className="grid grid-cols-2 gap-3">
                <InfoBox label="유형" value={data?.type || "-"} />
                <InfoBox label="등급" value={data?.type === "star" ? "G형" : "-"} />
                <InfoBox label="좌표" value={posText} />
                <InfoBox label="상태" value={<span className="text-emerald-300">정상</span>} />
              </div>
            </div>
          )}
          {tab === "images" && (
            <div className="grid grid-cols-2 gap-3">
              <Thumb url={data?.imageUrl || "/textures/planet_default.jpg"} />
              <Thumb url={data?.imageUrl || "/textures/planet_default.jpg"} />
              <Thumb url={data?.imageUrl || "/textures/planet_default.jpg"} />
              <Thumb url={data?.imageUrl || "/textures/planet_default.jpg"} />
            </div>
          )}
          {tab === "inner" && (
            <div className="space-y-3 text-cyan-100/90">
              <p>내부 구조 시뮬레이션이 여기 표시됩니다. (추후 2D/3D 단면도 연결)</p>
              <div className="h-52 rounded-xl bg-gradient-to-tr from-amber-300/20 to-fuchsia-300/10 border border-white/10" />
            </div>
          )}
        </div>

        {/* ✅ [수정] 하단 버튼 3개 (자세히, 구매, 구경) 삭제됨 */}
        {/* <div className="mt-5 grid grid-cols-3 gap-3"> ... </div> */}

      </div>
    </div>
  );
}

/* ----------------------------- Camera Controller ----------------------------- */
function CameraController({ target, track = true, onArrived }) {
  // ... (이하 동일)
  const controlsRef = useRef();
  const { camera } = useThree();

  const followingRef = useRef(false);
  const lastCamPosRef = useRef(new THREE.Vector3());
  const offsetRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (!target) {
      followingRef.current = false;
      controls.setLookAt(0, 0, 80, 0, 0, 0, true);
      return;
    }

    const dest = target.positionRef?.current
      ? target.positionRef.current.getWorldPosition(new THREE.Vector3())
      : (target.worldPos ? target.worldPos.clone() : new THREE.Vector3());

    const baseDist =
      target.type === "star" ? 20 :
      target.type === "planet" ? 12 :
      12;

    let dir = camera.position.clone().sub(dest);
    if (dir.lengthSq() < 1e-6) dir = new THREE.Vector3(0, 0, 1);
    dir.normalize();

    const arriveCamPos = dest.clone().add(dir.multiplyScalar(baseDist));

    followingRef.current = false;
    lastCamPosRef.current.copy(arriveCamPos);
    offsetRef.current.copy(arriveCamPos.clone().sub(dest));

    controls.enabled = false;
    controls
      .setLookAt(
        arriveCamPos.x, arriveCamPos.y, arriveCamPos.z,
        dest.x, dest.y, dest.z,
        true
      )
      .then(() => {
        controls.enabled = true;
        followingRef.current = true;
        onArrived && onArrived();
      });
  }, [target, camera, onArrived]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls || !followingRef.current || !target) return;
    if (!track) return;

    const p = target.positionRef?.current
      ? target.positionRef.current.getWorldPosition(new THREE.Vector3())
      : (target.worldPos ? target.worldPos : null);
    if (!p) return;

    const desiredCam = p.clone().add(offsetRef.current);
    lastCamPosRef.current.lerp(desiredCam, 0.08);

    controls.setLookAt(
      lastCamPosRef.current.x,
      lastCamPosRef.current.y,
      lastCamPosRef.current.z,
      p.x, p.y, p.z,
      false
    );
  });

  return <CameraControls ref={controlsRef} />;
}

/* ----------------------------- Main (✅ 수정됨) ----------------------------- */
export default function Universe() {
  const auth = useAuth();
  const [stars, setStars] = useState([]);
  const [planets, setPlanets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPurchase, setShowPurchase] = useState(false);

  useEffect(() => {
    // ... (이하 동일)
    const fetchAll = async () => {
      try {
        setIsLoading(true);
        const [starRes, planetRes] = await Promise.all([
          fetch("http://localhost:5000/api/stars"),
          fetch("http://localhost:5000/api/planets"),
        ]);
        if (!starRes.ok || !planetRes.ok) throw new Error("데이터 로딩 실패");
        setStars(await starRes.json());
        setPlanets(await planetRes.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="w-screen h-screen bg-black text-white relative">
      <Canvas camera={{ position: [0, 0, 80], fov: 75 }}>
        <Suspense fallback={<Html center><div className="text-white text-2xl">Loading...</div></Html>}>
          <ambientLight intensity={0.15} />
          <Stars radius={300} depth={50} count={9000} factor={8} fade />

          {!isLoading && !error && (
            <>
              {/* ✅ [수정] onSelect에서 setOpenDetail(true) 제거 */}
              {stars.map(d => (
                <Star key={d._id} data={d} position={[0, 0, 0]} onSelect={(item) => setSelected(item)} />
              ))}
              {/* ✅ [수정] onSelect에서 setOpenDetail(true) 제거 */}
              {planets.map(d => (
                <Planet
                  key={d._id}
                  data={d}
                  onSelect={(item) => setSelected(item)}
                  freezeOrbit={openDetail && selected?._id === d._id}
                />
              ))}
            </>
          )}

          {/* ✅ [수정] onArrived 프롭 제거 */}
          <CameraController
            target={selected}
            track={!(selected?.type === "planet" && openDetail)}
          />
        </Suspense>

        <EffectComposer>
          <Bloom luminanceThreshold={0.5} intensity={1.3} />
        </EffectComposer>
      </Canvas>

      {/* ✅ [수정] 로직은 그대로 두지만, onOpenDetail이 '정보 보기' 버튼을 통해 호출됨 */}
      {auth.user && <HUD username={auth.user.username} />}

      {selected && !showPurchase && (
        <ObjectPanel
          data={selected}
          onClose={() => { setSelected(null); setOpenDetail(false); }}
          onOpenDetail={() => setOpenDetail(true)}
          onBuy={() => setShowPurchase(true)}
        />
      )}

      {selected && showPurchase && (
        <PurchasePanel
          data={selected}
          onBack={() => setShowPurchase(false)}
        />
      )}
      
      {/* ✅ [수정] openDetail은 '정보 보기' 버튼을 통해서만 true가 됨 */}
      <DetailSlide open={openDetail} data={selected} onClose={() => setOpenDetail(false)} />

      {error && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30">
          <div className="card-glass px-4 py-2 text-red-300">{error}</div>
        </div>
      )}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-sm font-semibold flex items-center gap-2 shadow-lg transition"
          onClick={() => (window.location.href = "/market")}
        >
          🛒 마켓으로 이동
        </button>
      </div>
    </div>
  );
}