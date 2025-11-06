import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/celestia-styles.css";

// ===== 에디터/행성 규격 (서버와 동일하게 유지) =====
const GRID_W = 10;
const GRID_H = 5;
const CELL_PIXEL_W = 50;
const CELL_PIXEL_H = 50;
const PIXEL_SIZE = 10; // 렌더링상의 픽셀 크기(px)
// =================================================

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
  const { planet, cellId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const [color, setColor] = useState("#00ffff");
  const [isDrawing, setIsDrawing] = useState(false);
  const [baseImg, setBaseImg] = useState(null);
  const [pixels, setPixels] = useState([]); // [{x,y,color}]

  const width = CELL_PIXEL_W * PIXEL_SIZE;
  const height = CELL_PIXEL_H * PIXEL_SIZE;

  // ✅ 행성 이미지 로드
  useEffect(() => {
    const img = new Image();
    img.src = planetImages[planet] || "/textures/planet_default.jpg";
    img.onload = () => setBaseImg(img);
  }, [planet]);

  // ✅ 내 픽셀 불러오기
  useEffect(() => {
    const fetchMine = async () => {
      try {
        const token = localStorage.getItem("celestia_token");
        if (!token) return;

        const res = await fetch(
          `http://localhost:5000/api/pixels/mine/${planet}/${cellId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setPixels(data?.pixels || []);
      } catch (e) {
        console.error("❌ 내 픽셀 불러오기 실패:", e);
      }
    };
    fetchMine();
  }, [planet, cellId]);

  // ✅ 캔버스 렌더링
  useEffect(() => {
    if (!canvasRef.current || !baseImg) return;
    const ctx = canvasRef.current.getContext("2d");

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(baseImg, 0, 0, width, height);

    // 픽셀 표시
    pixels.forEach(({ x, y, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    });

    // 그리드선
    ctx.strokeStyle = "rgba(0,255,255,0.1)";
    for (let gx = 0; gx <= CELL_PIXEL_W; gx++) {
      ctx.beginPath();
      ctx.moveTo(gx * PIXEL_SIZE + 0.5, 0);
      ctx.lineTo(gx * PIXEL_SIZE + 0.5, height);
      ctx.stroke();
    }
    for (let gy = 0; gy <= CELL_PIXEL_H; gy++) {
      ctx.beginPath();
      ctx.moveTo(0, gy * PIXEL_SIZE + 0.5);
      ctx.lineTo(width, gy * PIXEL_SIZE + 0.5);
      ctx.stroke();
    }
  }, [baseImg, pixels]);

  // ✅ 픽셀 찍기
  const drawAt = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const px = Math.floor((clientX - rect.left) / PIXEL_SIZE);
    const py = Math.floor((clientY - rect.top) / PIXEL_SIZE);
    if (px < 0 || py < 0 || px >= CELL_PIXEL_W || py >= CELL_PIXEL_H) return;

    setPixels((prev) => {
      const idx = prev.findIndex((p) => p.x === px && p.y === py);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = { x: px, y: py, color };
        return next;
      }
      return [...prev, { x: px, y: py, color }];
    });
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    drawAt(e.clientX, e.clientY);
  };
  const handleMouseMove = (e) => {
    if (isDrawing) drawAt(e.clientX, e.clientY);
  };
  const handleMouseUp = () => setIsDrawing(false);

  // ✅ 서버 저장
  const handleSave = async () => {
    const token = localStorage.getItem("celestia_token");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      const res = await fetch("http://localhost:5000/api/pixels/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planetName: planet,
          cellId,
          pixels,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "저장 실패");
      alert("✅ 픽셀 저장 완료");
    } catch (e) {
      console.error(e);
      alert("서버 오류");
    }
  };

  // ✅ 초기화 버튼 (모든 픽셀 삭제)
  const handleClear = () => {
    if (window.confirm("정말 모든 픽셀을 초기화할까요?")) {
      setPixels([]);
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, width, height);
      if (baseImg) ctx.drawImage(baseImg, 0, 0, width, height);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <div className="text-xl font-bold">
        {planet} — {cellId} 구역 편집
      </div>

      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-16 h-10"
      />

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ border: "1px solid cyan", cursor: "crosshair" }}
      />

      <div className="flex gap-3 mt-2">
        <button className="btn btn-outline" onClick={handleSave}>
          저장하기
        </button>
        <button className="btn btn-ghost" onClick={() => navigate("/mypage")}>
          돌아가기
        </button>
        <button className="btn btn-error" onClick={handleClear}>
          초기화
        </button>
      </div>
    </div>
  );
}
