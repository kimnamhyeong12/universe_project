// src/pages/ViewPlanet.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/celestia-styles.css";

export default function ViewPlanet() {
  const { planet } = useParams(); // URL에서 /view/:planet 형식으로 받기
  const canvasRef = useRef(null);
  const [pixelData, setPixelData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ 행성 기본 이미지 매핑
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

  // ✅ 픽셀 데이터 로드
  useEffect(() => {
    async function fetchPixels() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/pixels/planet/${planet}`);
        if (!res.ok) throw new Error("픽셀 데이터를 불러올 수 없습니다.");
        const data = await res.json();
        setPixelData(data);
      } catch (err) {
        console.error("❌ 픽셀 불러오기 오류:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPixels();
  }, [planet]);

  // ✅ 픽셀들을 행성 평면 위에 합성 + 창 크기에 맞게 리사이즈
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // 기본 설정 (백엔드와 일치)
    const GRID_W = 10;
    const GRID_H = 5;
    const CELL_PIXEL_W = 50;
    const CELL_PIXEL_H = 50;
    const PIXEL_SIZE = 4;

    // 전체 평면 원본 크기
    const totalWidth = GRID_W * CELL_PIXEL_W * PIXEL_SIZE;
    const totalHeight = GRID_H * CELL_PIXEL_H * PIXEL_SIZE;

    // 브라우저 창 크기에 맞춰 자동 리사이즈
    const resizeCanvas = () => {
      const screenWidth = window.innerWidth * 0.9; // 약간 여백
      const screenHeight = window.innerHeight * 0.7;
      const aspect = totalWidth / totalHeight;

      let newWidth = screenWidth;
      let newHeight = screenWidth / aspect;

      if (newHeight > screenHeight) {
        newHeight = screenHeight;
        newWidth = screenHeight * aspect;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      // 스케일링 비율 계산
      const scaleX = newWidth / totalWidth;
      const scaleY = newHeight / totalHeight;

      // 행성 텍스처 배경
      const baseImg = new Image();
      baseImg.src = planetImages[planet] || "/textures/planet_default.jpg";

      baseImg.onload = () => {
        ctx.drawImage(baseImg, 0, 0, newWidth, newHeight);

        // 픽셀 데이터 그리기 (비율 보정 포함)
        pixelData.forEach((cell) => {
          const [cx, cy] = cell.cellId.split("-").map(Number);
          const offsetX = cx * CELL_PIXEL_W * PIXEL_SIZE * scaleX;
          const offsetY = cy * CELL_PIXEL_H * PIXEL_SIZE * scaleY;

          cell.pixels.forEach((p) => {
            ctx.fillStyle = p.color;
            ctx.fillRect(
              offsetX + p.x * PIXEL_SIZE * scaleX,
              offsetY + p.y * PIXEL_SIZE * scaleY,
              PIXEL_SIZE * scaleX,
              PIXEL_SIZE * scaleY
            );
          });
        });
      };
    };

    // 초기 렌더링 + 윈도우 리사이즈 시 다시 맞춤
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [pixelData, planet]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-cyan-200 text-2xl">
        🚀 행성 데이터를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#030b15] text-white">
      <h1 className="text-4xl font-extrabold mb-3">{planet} 구경하기 🌍</h1>
      <p className="text-cyan-300/80 mb-6">
        이 행성의 모든 유저가 남긴 픽셀 아트가 표시됩니다.
      </p>

      {/* ✅ 스크롤 없이 자동 맞춤 표시 */}
      <div className="border border-cyan-400/50 rounded-lg p-2 bg-black/40 shadow-xl flex justify-center items-center overflow-hidden">
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "auto" }} />
      </div>

      <div className="mt-8 flex gap-4">
        <Link to="/universe" className="btn-neo btn-neo--lg">
          🌌 우주로 돌아가기
        </Link>
        <Link to="/market" className="btn-neo btn-neo--lg">
          🛒 마켓 보기
        </Link>
      </div>
    </div>
  );
}
