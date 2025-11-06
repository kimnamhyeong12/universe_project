// src/pages/PixelEditor.jsx
import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/celestia-styles.css";

const GRID_W = 10;
const GRID_H = 10;
const CELL_PIXEL_W = 50;
const CELL_PIXEL_H = 50;
const PIXEL_SIZE = 8; // 확대 비율

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
  const navigate = useNavigate();
  const { user } = useAuth();

  const canvasRef = useRef(null);
  const [color, setColor] = useState("#00ffff");
  const [pixels, setPixels] = useState([]);
  const [baseImg, setBaseImg] = useState(null);

  // ✅ 행성 텍스처 로드
  useEffect(() => {
    const img = new Image();
    img.src = planetImages[planet] || "/textures/planet_default.jpg";
    img.onload = () => setBaseImg(img);
  }, [planet]);

  // ✅ 내 픽셀 불러오기
  useEffect(() => {
    const token =
      localStorage.getItem("jwt") ||
      localStorage.getItem("celestia_token") ||
      localStorage.getItem("token");

    if (!token) return;

    (async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/pixels/mine/${planet}/${cellId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setPixels(Array.isArray(data?.pixels) ? data.pixels : []);
      } catch (err) {
        console.error("❌ 내 픽셀 불러오기 실패:", err);
      }
    })();
  }, [planet, cellId]);

  // ✅ 캔버스 렌더링
  useEffect(() => {
    if (!canvasRef.current || !baseImg) return;
    const ctx = canvasRef.current.getContext("2d");

    const [cx, cy] = cellId.split("-").map(Number);
    const texW = baseImg.naturalWidth;
    const texH = baseImg.naturalHeight;

    // 10x10 격자 기준 크롭
    const srcW = texW / GRID_W;
    const srcH = texH / GRID_H;
    const sx = cx * srcW;
    const sy = cy * srcH;

    // 16:9 비율 계산 (하나의 셀 비율 유지)
    const aspect = srcW / srcH;
    const targetW = CELL_PIXEL_W * PIXEL_SIZE;
    const targetH = targetW / aspect;

    canvasRef.current.width = targetW;
    canvasRef.current.height = targetH;

    // 배경
    ctx.drawImage(baseImg, sx, sy, srcW, srcH, 0, 0, targetW, targetH);

    // 픽셀 그리기
    pixels.forEach(({ x, y, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        (x * targetW) / CELL_PIXEL_W,
        (y * targetH) / CELL_PIXEL_H,
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
  }, [baseImg, pixels, cellId]);

  // ✅ 그리기
  const drawAt = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * CELL_PIXEL_W);
    const y = Math.floor(((clientY - rect.top) / rect.height) * CELL_PIXEL_H);
    if (x < 0 || y < 0 || x >= CELL_PIXEL_W || y >= CELL_PIXEL_H) return;

    setPixels((prev) => {
      const idx = prev.findIndex((p) => p.x === x && p.y === y);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { x, y, color };
        return next;
      }
      return [...prev, { x, y, color }];
    });
  };

  // ✅ 초기화
  const handleClear = () => {
    if (!window.confirm("정말 모든 픽셀을 초기화할까요?")) return;
    setPixels([]);
  };

  // ✅ 저장
  const handleSave = async () => {
    const token =
      localStorage.getItem("jwt") ||
      localStorage.getItem("celestia_token") ||
      localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      const res = await fetch("http://localhost:5000/api/pixels/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planetName: planet, cellId, pixels }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message);
      alert("✅ 픽셀 저장 완료!");
    } catch (e) {
      alert("서버 오류");
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-bold">
        {planet} — {cellId} 구역 편집
      </h2>
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-16 h-10"
      />
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => drawAt(e.clientX, e.clientY)}
        onMouseMove={(e) => e.buttons === 1 && drawAt(e.clientX, e.clientY)}
        style={{ border: "1px solid cyan", cursor: "crosshair" }}
      />
      <div className="flex gap-3 mt-3">
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
