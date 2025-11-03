import React, { useRef, useState, useEffect, Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Stars, Text, Html, useTexture, Plane, Sphere,
  useVideoTexture, Billboard, CameraControls,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import "../styles/celestia-styles.css";

/* HUD */
function HUD({ username }) {
  return (
    <div className="absolute top-4 left-4 z-30">
      <div className="cel-hud card-glass px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/60 to-indigo-500/60 shadow-lg shadow-cyan-500/30" />
          <div>
            <div className="text-cyan-300 font-bold tracking-wide text-lg">
              환영합니다, {username}님!
            </div>
            <div className="text-xs text-cyan-200/70">SECTOR: ORION · VISUAL MODE: ULTRA</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 오브젝트들 */
function Planet({ data, position, onSelect }) {
  const meshRef = useRef();
  const texture = useTexture(data.imageUrl || "/textures/planet_default.jpg");
  useFrame((_, d) => { if (meshRef.current) meshRef.current.rotation.y += d * 0.1; });
  return (
    <group position={position} onClick={() => onSelect({ ...data, type: "planet", position })}>
      <Sphere ref={meshRef} args={[1.5, 32, 32]}>
        <meshStandardMaterial map={texture} />
      </Sphere>
      <Text position={[0, -2.3, 0]} fontSize={0.45} color="white" anchorX="center">
        {data.name}
      </Text>
    </group>
  );
}
function Star({ data, position, onSelect }) {
  const texture = useTexture(data.imageUrl || "/textures/sun.jpg");
  return (
    <group position={position} onClick={() => onSelect({ ...data, type: "star", position })}>
      <Sphere args={[2.5, 32, 32]}>
        <meshStandardMaterial map={texture} emissive="yellow" emissiveIntensity={2} />
      </Sphere>
      <pointLight intensity={300} distance={500} color="#FFD700" />
      <Text position={[0, -3, 0]} fontSize={0.5} color="yellow" anchorX="center">
        {data.name}
      </Text>
    </group>
  );
}
function Blackhole({ data, position, onSelect }) {
  const diskRef = useRef();
  const texture = useVideoTexture(data.imageUrl || "/textures/blackhole.mp4", {
    start: true, loop: true, muted: true, crossOrigin: "anonymous",
  });
  useFrame((_, d) => { if (diskRef.current) diskRef.current.rotation.z += d * 0.5; });
  return (
    <group position={position} onClick={() => onSelect({ ...data, type: "blackhole", position })}>
      <Sphere args={[2, 32, 32]}><meshBasicMaterial color="black" /></Sphere>
      <Billboard>
        <Plane ref={diskRef} args={[8, 8]}>
          <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
        </Plane>
      </Billboard>
      <Text position={[0, -5, 0]} fontSize={0.45} color="red" anchorX="center">
        {data.name}
      </Text>
    </group>
  );
}
function Galaxy({ data, position, onSelect }) {
  const texture = useTexture(data.imageUrl || "/textures/galaxy.png");
  return (
    <Billboard position={position} onClick={() => onSelect({ ...data, type: "galaxy", position })}>
      <Plane args={[8, 8]}>
        <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
      </Plane>
      <Text position={[0, -5, 0]} fontSize={0.45} color="#00ffff" anchorX="center">
        {data.name}
      </Text>
    </Billboard>
  );
}

/* 카메라 포커스 */
function CameraController({ target, onArrived }) {
  const ref = useRef();
  const { camera } = useThree();
  useEffect(() => {
    if (!ref.current) return;
    const goHome = () => ref.current.setLookAt(0, 0, 50, 0, 0, 0, true);
    if (!target) { goHome(); return; }

    const dest = new THREE.Vector3(...target.position);
    const base = target.type === "star" ? 9 : target.type === "planet" ? 6 : target.type === "blackhole" ? 8 : 7;
    const from = camera.position.clone();
    const dir = dest.clone().sub(from).normalize();
    const cam = dest.clone().add(dir.multiplyScalar(-base));

    ref.current.enabled = false;
    ref.current.setLookAt(cam.x, cam.y, cam.z, dest.x, dest.y, dest.z, true)
      .then(() => { ref.current.enabled = true; onArrived && onArrived(); });
  }, [target]);
  return <CameraControls ref={ref} />;
}

/* 공통 작은 UI */
function Thumb({ url }) { return <div className="thumb" style={{ backgroundImage: `url(${url})` }} />; }
function InfoBox({ label, value }) {
  return (
    <div className="bg-white/5 rounded-md px-4 py-3 border border-white/10 flex items-center justify-between">
      <span className="text-cyan-200/80 text-sm md:text-base">{label}</span>
      <span className="text-cyan-100 font-semibold text-base md:text-lg">{value}</span>
    </div>
  );
}

/* ▽▽ 변경 포인트: 세로 길게, 가로 얇게 ▽▽ */
function ObjectPanel({ data, onClose, onOpenDetail }) {
  const isStar = data.type === "star";
  return (
    <div className="absolute left-8 md:left-10 z-20 top-28 md:top-32">
      <div
        className={`
          card-glass panel-tall panel-narrow
          w-[360px] sm:w-[380px] md:w-[400px]   /* ✅ 가로 얇게 */
          p-6 md:p-7
        `}
      >
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-amber-400/70 to-yellow-200/50 shadow-[0_0_30px_-5px_rgba(255,200,0,0.8)]" />
          <div>
            <div className="text-[28px] md:text-[32px] font-extrabold text-white drop-shadow">
              {data.name}
            </div>
            <div className="text-sm text-cyan-200/70">{isStar ? "항성" : data.type}</div>
          </div>
        </div>

        {/* 인포 박스: 한 줄 1칸(세로로 길~게) */}
        <div className="mt-4 grid grid-cols-1 gap-3 text-cyan-100/90">
          <InfoBox label="크기" value={isStar ? "대" : "중"} />
          <InfoBox label="등급" value={isStar ? "G형" : "—"} />
          <InfoBox label="좌표" value={data.position.map(n => n.toFixed(1)).join(", ")} />
          <InfoBox label="상태" value={<span className="text-emerald-300">정상</span>} />
        </div>

        {/* 액션 버튼 (세로 스택) */}
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn-neo btn-neo--lg" onClick={onOpenDetail}>정보 보기</button>
          <button className="btn-neo btn-neo--lg" onClick={() => alert("💰 구매하기")}>구매하기</button>
          <button className="btn-neo btn-neo--lg" onClick={() => alert("👀 구경하기")}>구경하기</button>
        </div>

        {/* 푸터 */}
        <div className="mt-4 flex items-center justify-between text-xs text-cyan-200/70">
          <span>VER. 3.2 · HYPERDRIVE</span>
          <button className="hover:text-white transition" onClick={onClose}>닫기 ✖</button>
        </div>
      </div>
    </div>
  );
}

/* 우측 디테일 패널(기존 유지) */
function DetailSlide({ open, data, onClose }) {
  const [tab, setTab] = useState("info");
  return (
    <div className={`detail-wrap ${open ? "open" : ""}`}>
      <div className="detail-panel card-glass">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-cyan-200/70 uppercase tracking-widest">detail view</div>
            <div className="text-2xl font-extrabold text-white drop-shadow">{data?.name || "-"}</div>
          </div>
          <button className="btn-ghost" onClick={onClose}>닫기 ✖</button>
        </div>

        <div className="tabs mt-5">
          <button className={`tab ${tab === "info" ? "active" : ""}`} onClick={() => setTab("info")}>정보</button>
          <button className={`tab ${tab === "images" ? "active" : ""}`} onClick={() => setTab("images")}>이미지</button>
          <button className={`tab ${tab === "inner" ? "active" : ""}`} onClick={() => setTab("inner")}>내부구조</button>
        </div>

        <div className="mt-5 min-h-[340px]">
          {tab === "info" && (
            <div className="space-y-4 text-cyan-100/90">
              <p className="leading-relaxed">{data?.description || "이 천체에 대한 설명이 준비 중입니다."}</p>
              <div className="grid grid-cols-2 gap-3">
                <InfoBox label="유형" value={data?.type || "-"} />
                <InfoBox label="등급" value={data?.type === "star" ? "G형" : "-"} />
                <InfoBox label="좌표" value={data?.position ? data.position.map(n=>n.toFixed(1)).join(", ") : "-"} />
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

        <div className="mt-5 grid grid-cols-3 gap-3">
          <button className="btn-neo btn-neo--lg" onClick={()=>alert("🔍 더 알아보기")}>자세히</button>
          <button className="btn-neo btn-neo--lg" onClick={()=>alert("💰 구매하기")}>구매</button>
          <button className="btn-neo btn-neo--lg" onClick={()=>alert("👀 구경하기")}>구경</button>
        </div>
      </div>
    </div>
  );
}

/* 좌표 고정 유틸 */
function makePos(seed) {
  const rnd = (() => { let s = seed; return (min, max) => { s = Math.sin(s * 78.233 + 1.234) * 43758.5453; return min + (max - min) * (s - Math.floor(s)); }; })();
  return [rnd(-100, 100), rnd(-25, 25), rnd(-100, 100)];
}

/* 메인 */
export default function Universe() {
  const auth = useAuth();
  const [galaxies, setGalaxies] = useState([]);
  const [stars, setStars] = useState([]);
  const [planets, setPlanets] = useState([]);
  const [blackholes, setBlackholes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posMap, setPosMap] = useState({});
  const [openDetail, setOpenDetail] = useState(false);
  const posOf = (type, id) => posMap[`${type}:${id}`] ?? [0,0,0];

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);
        const [galRes, starRes, planetRes, bhRes] = await Promise.all([
          fetch("http://localhost:5000/api/galaxies"),
          fetch("http://localhost:5000/api/stars"),
          fetch("http://localhost:5000/api/planets"),
          fetch("http://localhost:5000/api/blackholes"),
        ]);
        if (!galRes.ok || !starRes.ok || !planetRes.ok || !bhRes.ok) throw new Error("데이터 로딩 실패");
        const [gals, sts, pls, bhs] = await Promise.all([galRes.json(), starRes.json(), planetRes.json(), bhRes.json()]);
        setGalaxies(gals); setStars(sts); setPlanets(pls); setBlackholes(bhs);
        const m = {}; let seed = 1;
        const put = (t, arr) => arr.forEach(d => { m[`${t}:${d._id}`] = makePos(seed++); });
        put("galaxy", gals); put("star", sts); put("planet", pls); put("blackhole", bhs);
        setPosMap(m);
      } catch(e){ setError(e.message); } finally { setIsLoading(false); }
    };
    fetchAll();
  }, []);

  return (
    <div className="w-screen h-screen bg-black text-white relative">
      <Canvas camera={{ position: [0, 0, 50], fov: 75 }}>
        <Suspense fallback={<Html center><div className="text-white text-2xl">Loading...</div></Html>}>
          <ambientLight intensity={0.1} />
          <Stars radius={300} depth={50} count={9000} factor={8} fade />
          {!isLoading && !error && (
            <>
              {galaxies.map(d => <Galaxy key={d._id} data={d} position={posOf("galaxy", d._id)} onSelect={setSelected} />)}
              {stars.map(d => <Star key={d._id} data={d} position={posOf("star", d._id)} onSelect={setSelected} />)}
              {planets.map(d => <Planet key={d._id} data={d} position={posOf("planet", d._id)} onSelect={setSelected} />)}
              {blackholes.map(d => <Blackhole key={d._id} data={d} position={posOf("blackhole", d._id)} onSelect={setSelected} />)}
            </>
          )}
          <CameraController target={selected} onArrived={() => selected && setOpenDetail(true)} />
        </Suspense>
        <EffectComposer>
          <Bloom luminanceThreshold={0.5} intensity={1.5} />
        </EffectComposer>
      </Canvas>

      {auth.user && <HUD username={auth.user.username} />}

      {selected && (
        <ObjectPanel
          data={selected}
          onClose={() => { setSelected(null); setOpenDetail(false); }}
          onOpenDetail={() => setOpenDetail(true)}
        />
      )}

      <DetailSlide open={openDetail} data={selected} onClose={() => setOpenDetail(false)} />
    </div>
  );
}
