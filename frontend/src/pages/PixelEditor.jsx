import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HexColorPicker, HexColorInput } from "react-colorful"; // 🎨 항상 열린 파레트용
import "../styles/celestia-styles.css";

const GRID_W = 10;
const GRID_H = 10;
const CELL_PIXEL_W = 50;
const CELL_PIXEL_H = 50;
const PIXEL_SIZE = 8;
const SCALE = 1.6;

const planetImages = {
  수성: "/textures/mercury.jpg",
  금성: "/textures/venus.jpg",
  지구: "/textures/earth.jpg",
  화성: "/textures/mars.jpg",
  목성: "/textures/jupiter.jpg",
  토성: "/textures/saturn.jpg",
  천왕성: "/textures/uranus.jpg",
  해왕성: "/textures/neptune.jpg",
  태양: "/textures/sun.jpg",
};

export default function PixelEditor() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canvasRef = useRef(null);

  const [color, setColor] = useState("#00ffff");
  const [pixels, setPixels] = useState([]);
  const [baseImg, setBaseImg] = useState(null);
  const [eraseMode, setEraseMode] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [planet, setPlanet] = useState("");
  const [cellId, setCellId] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ UUID 토큰으로 셀 정보 및 픽셀 불러오기
  useEffect(() => {
    const jwt =
      localStorage.getItem("jwt") ||
      localStorage.getItem("celestia_token") ||
      localStorage.getItem("token");

    if (!jwt) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/pixels/byToken/${token}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || "접근 권한이 없습니다.");
          navigate("/mypage");
          return;
        }

        setPlanet(data.planetName);
        setCellId(data.cellId);
        setPixels(Array.isArray(data?.pixels) ? data.pixels : []);

        const img = new Image();
        img.src = planetImages[data.planetName] || "/textures/planet_default.jpg";
        img.onload = () => {
          setBaseImg(img);
          setLoading(false);
        };
      } catch (err) {
        console.error("❌ 픽셀 불러오기 실패:", err);
        alert("서버 연결 오류가 발생했습니다.");
        navigate("/mypage");
      }
    })();
  }, [token, navigate]);

  // ✅ 캔버스 렌더링 (행성 셀 비율 반영)
  useEffect(() => {
    if (!canvasRef.current || !baseImg || !planet || !cellId) return;
    const ctx = canvasRef.current.getContext("2d");

    const [cx, cy] = cellId.split("-").map(Number);
    const texW = baseImg.naturalWidth;
    const texH = baseImg.naturalHeight;
    const srcW = texW / GRID_W;
    const srcH = texH / GRID_H;
    const sx = cx * srcW;
    const sy = cy * srcH;

    const aspect = srcW / srcH;
    const baseSize = CELL_PIXEL_W * PIXEL_SIZE * SCALE;
    let targetH = baseSize;
    let targetW = baseSize * aspect;

    const maxH = window.innerHeight * 0.6;
    if (targetH > maxH) {
      const ratio = maxH / targetH;
      targetH *= ratio;
      targetW *= ratio;
    }

    if (
      Math.abs(canvasSize.w - targetW) > 1 ||
      Math.abs(canvasSize.h - targetH) > 1
    ) {
      setCanvasSize({ w: targetW, h: targetH });
    }

    const canvas = canvasRef.current;
    canvas.width = targetW;
    canvas.height = targetH;

    // 배경 (해당 셀 부분만 크롭)
    ctx.drawImage(baseImg, sx, sy, srcW, srcH, 0, 0, targetW, targetH);

    // 픽셀
    pixels.forEach(({ x, y, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        x * (targetW / CELL_PIXEL_W),
        y * (targetH / CELL_PIXEL_H),
        targetW / CELL_PIXEL_W,
        targetH / CELL_PIXEL_H
      );
    });

    // 격자선
    ctx.strokeStyle = "rgba(0,255,255,0.15)";
    for (let gx = 0; gx <= CELL_PIXEL_W; gx++) {
      const x = (gx * targetW) / CELL_PIXEL_W;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, targetH);
      ctx.stroke();
    }
    for (let gy = 0; gy <= CELL_PIXEL_H; gy++) {
      const y = (gy * targetH) / CELL_PIXEL_H;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(targetW, y);
      ctx.stroke();
    }
  }, [baseImg, pixels, cellId, planet, canvasSize]);

  // ✅ 픽셀 찍기 / 지우기
  const drawAt = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    const x = Math.floor((relX / rect.width) * CELL_PIXEL_W);
    const y = Math.floor((relY / rect.height) * CELL_PIXEL_H);
    if (x < 0 || y < 0 || x >= CELL_PIXEL_W || y >= CELL_PIXEL_H) return;

    setPixels((prev) => {
      const idx = prev.findIndex((p) => p.x === x && p.y === y);
      if (eraseMode) {
        if (idx >= 0) {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        }
        return prev;
      } else {
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { x, y, color };
          return next;
        }
        return [...prev, { x, y, color }];
      }
    });
  };

  // ✅ 전체 초기화
  const handleClear = () => {
    if (!window.confirm("정말 모든 픽셀을 초기화할까요?")) return;
    setPixels([]);
  };

  // ✅ 저장 (UUID 기반)
  const handleSave = async () => {
    const jwt =
      localStorage.getItem("jwt") ||
      localStorage.getItem("celestia_token") ||
      localStorage.getItem("token");
    if (!jwt) return alert("로그인이 필요합니다.");

    try {
      const res = await fetch("http://localhost:5000/api/pixels/saveByToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ token, pixels }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.message);
      alert("✅ 픽셀 저장 완료!");
    } catch (e) {
      alert("서버 오류");
      console.error(e);
    }
  };

  // ✅ 로딩 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-cyan-300 text-lg">로딩 중...</p>
      </div>
    );
  }

  // ✅ 메인 UI
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center">
      <h2 className="text-2xl font-bold mb-6">
        {planet && cellId ? `${planet} — ${cellId} 구역 편집` : "로딩 중..."}
      </h2>

      <div className="flex items-center justify-center gap-10">
        {/* 왼쪽 버튼 */}
        <div className="flex flex-col gap-4">
          <button onClick={handleSave} className="btn btn-outline w-28 h-12">
            저장하기
          </button>
          <button
            onClick={() => navigate("/mypage")}
            className="btn btn-outline w-28 h-12"
          >
            돌아가기
          </button>
          <button onClick={handleClear} className="btn btn-outline w-28 h-12">
            초기화
          </button>
        </div>

        {/* 캔버스 */}
        <canvas
          ref={canvasRef}
          onMouseDown={(e) => drawAt(e.clientX, e.clientY)}
          onMouseMove={(e) => e.buttons === 1 && drawAt(e.clientX, e.clientY)}
          style={{
            border: "1px solid cyan",
            cursor: eraseMode ? "not-allowed" : "crosshair",
            display: "block",
            width: `${canvasSize.w}px`,
            height: `${canvasSize.h}px`,
            imageRendering: "pixelated",
          }}
        />

        {/* 🎨 오른쪽 컬러피커 */}
        <div className="flex flex-col items-center gap-4 w-44">
          <HexColorPicker color={color} onChange={setColor} />
          <HexColorInput
            color={color}
            onChange={setColor}
            prefixed
            className="w-28 h-10 text-center text-black rounded-md"
          />
          <div
            className="w-24 h-10 rounded-md border border-cyan-400"
            style={{ backgroundColor: color }}
          ></div>
          <button
            onClick={() => setEraseMode(!eraseMode)}
            className={`btn w-24 ${
              eraseMode ? "bg-red-500 text-white" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {eraseMode ? "지우개 ON" : "지우개 OFF"}
          </button>
        </div>
      </div>
    </div>
  );
}
