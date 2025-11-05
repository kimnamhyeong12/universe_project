import React, { useState, useEffect } from "react";
import { Stage, Layer, Rect as KRect } from "react-konva";

/**
 * HUD 컴포넌트 (상단 바 UI)
 */
function HUD({ left, children }) {
  return (
    <div
      className={`absolute top-5 ${left ? "left-5" : "right-5"} z-20 p-4 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10`}
    >
      {children}
    </div>
  );
}

/**
 * PixelEditor 메인 컴포넌트
 */
export default function PixelEditor({ planetName = "미지의 행성", onBack = () => {} }) {
  const [pixels, setPixels] = useState([
    { x: 0, y: 0, color: "#FF0000", owner: "kimnamhyeong12" },
    { x: 0, y: 1, color: "#00FF00", owner: "joyeongjun" },
    { x: 1, y: 0, color: "#0000FF", owner: "joyeongjun" },
    { x: 1, y: 1, color: "#FFFFFF", owner: null },
    { x: 2, y: 0, color: "#FFFFFF", owner: null },
    { x: 2, y: 1, color: "#FFFFFF", owner: null },
    { x: 2, y: 2, color: "#FFFFFF", owner: null },
    { x: 0, y: 2, color: "#FFFFFF", owner: null },
    { x: 1, y: 2, color: "#FFFFFF", owner: null },
  ]);

  const GRID_SIZE = 20;
  const PIXEL_SIZE = 30;
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [stageSize, setStageSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setStageSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handlePixelClick = (px) => {
    if (px.owner && px.owner !== "joyeongjun") {
      alert(`[${px.owner}]님의 구역입니다.`);
      return;
    }
    setPixels((prev) =>
      prev.map((p) => (p.x === px.x && p.y === px.y ? { ...p, color: selectedColor } : p))
    );
  };

  const palette = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FFFFFF", "#000000"];

  return (
    <div className="w-screen h-screen bg-[#0b1020] relative">
      {/* 상단 바 */}
      <HUD left>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/20"
          >
            ← 3D로 돌아가기
          </button>
          <div className="text-cyan-300 font-bold">{planetName} · 픽셀 에디터</div>
        </div>
      </HUD>

      {/* 팔레트 */}
      <div className="absolute top-5 right-5 z-20 p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 flex gap-2">
        {palette.map((c) => (
          <div
            key={c}
            onClick={() => setSelectedColor(c)}
            className="w-9 h-9 rounded-full border-2 cursor-pointer"
            style={{
              background: c,
              borderColor: selectedColor === c ? "#00ffff" : "transparent",
            }}
          />
        ))}
      </div>

      {/* Konva Stage */}
      <Stage width={stageSize.w} height={stageSize.h} draggable>
        <Layer>
          {pixels.map((p, i) => (
            <KRect
              key={i}
              x={p.x * PIXEL_SIZE}
              y={p.y * PIXEL_SIZE}
              width={PIXEL_SIZE}
              height={PIXEL_SIZE}
              fill={p.color}
              stroke="#333"
              strokeWidth={1}
              onClick={() => handlePixelClick(p)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
