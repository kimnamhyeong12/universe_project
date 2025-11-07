// src/pages/ViewPlanet.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/celestia-styles.css";

// ===== [공통 규격 - 백엔드와 동일] =====
const GRID_W = 10;
const GRID_H = 10;
const CELL_PIXEL_W = 50;
const CELL_PIXEL_H = 50;
// ======================================

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

export default function ViewPlanet() {
  const { planet } = useParams();
  const canvasRef = useRef(null);
  const [pixelData, setPixelData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ 자동 새로고침 (편집 후 돌아올 때)
  useEffect(() => {
    const lastEdited = localStorage.getItem("lastEditedPlanet");
    if (lastEdited === planet) {
      localStorage.removeItem("lastEditedPlanet");
      window.location.reload();
    }
  }, [planet]);

  // ✅ 픽셀 데이터 불러오기
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/pixels/planet/${planet}?t=${Date.now()}`);
        if (!res.ok) throw new Error("픽셀 데이터를 불러올 수 없습니다.");
        const data = await res.json();
        setPixelData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ 픽셀 불러오기 오류:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [planet]);

  // ✅ 캔버스 렌더링 (GRID 기준 정확히 맞춤)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const base = new Image();
    base.src = planetImages[planet] || "/textures/planet_default.jpg";

    base.onload = () => {
      const texW = base.naturalWidth;
      const texH = base.naturalHeight;

      // 셀 기준 비율 (GRID 기반)
      const cellW = texW / GRID_W;
      const cellH = texH / GRID_H;

      // 실제 캔버스 크기: GRID 전체 + 픽셀 크기 반영
      canvas.width = texW;
      canvas.height = texH;

      // 배경 그리기
      ctx.drawImage(base, 0, 0, texW, texH);

      // 각 셀의 픽셀 데이터 렌더링
      pixelData.forEach((cell) => {
        const [cx, cy] = String(cell.cellId).split("-").map(Number);
        if (isNaN(cx) || isNaN(cy)) return;

        // 셀의 시작 좌표 (이미지 상 위치)
        const startX = cx * cellW;
        const startY = cy * cellH;

        // 셀 내부 픽셀 스케일 변환
        const scaleX = cellW / CELL_PIXEL_W;
        const scaleY = cellH / CELL_PIXEL_H;

        (cell.pixels || []).forEach((p) => {
          const px = startX + p.x * scaleX;
          const py = startY + p.y * scaleY;
          ctx.fillStyle = p.color;
          ctx.fillRect(px, py, scaleX, scaleY);
        });
      });
    };
  }, [pixelData, planet]);

  // ✅ 로딩 중
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-cyan-200 text-2xl">
        🚀 행성 데이터를 불러오는 중입니다...
      </div>
    );
  }

  // ✅ 메인 렌더링
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#030b15] text-white">
      <h1 className="text-4xl font-extrabold mb-3 flex items-center gap-2">
        {planet} 구경하기 <span role="img" aria-label="planet">🌍</span>
      </h1>
      <p className="text-cyan-300/80 mb-6">
        이 행성의 모든 유저가 남긴 픽셀 아트가 표시됩니다.
      </p>

      {/* ✅ 뷰포트 */}
      <div
        className="border border-cyan-400/50 rounded-lg p-2 bg-black/40 shadow-xl flex justify-center items-center overflow-hidden"
        style={{
          width: "750px",
          height: "420px",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            imageRendering: "pixelated",
          }}
        />
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
