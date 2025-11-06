import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/celestia-styles.css";

// ===== [공통 규격 - 백엔드와 동일] =====
const GRID_W = 10;
const GRID_H = 10;
const CELL_PIXEL_W = 50;
const CELL_PIXEL_H = 50;
const PIXEL_SIZE = 4;
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

  // ✅ 캔버스 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const base = new Image();
    base.src = planetImages[planet] || "/textures/planet_default.jpg";

    base.onload = () => {
      // 기본 비율 계산
      const aspect = base.width / base.height;
      const totalWidth = GRID_W * CELL_PIXEL_W;
      const totalHeight = GRID_H * CELL_PIXEL_H;

      // 내부 해상도 (픽셀 그릴 기준)
      canvas.width = totalWidth;
      canvas.height = totalHeight;

      // 배경 행성 이미지
      ctx.drawImage(base, 0, 0, canvas.width, canvas.height);

      // 픽셀 데이터 렌더링
      pixelData.forEach((cell) => {
        const [cx, cy] = String(cell.cellId).split("-").map(Number);
        const offsetX = cx * CELL_PIXEL_W;
        const offsetY = cy * CELL_PIXEL_H;

        (cell.pixels || []).forEach((p) => {
          ctx.fillStyle = p.color;
          ctx.fillRect(
            offsetX + p.x,
            offsetY + p.y,
            1, // ✅ 실제 에디터 1픽셀 기준
            1
          );
        });
      });
    };
  }, [pixelData, planet]);

  // ✅ 로딩 상태
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

      {/* ✅ 크기 제한된 뷰포트 */}
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
            width: "100%", // 화면에서 보기 좋게 스케일링
            height: "100%",
            imageRendering: "pixelated", // ✅ 픽셀 선명하게
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
