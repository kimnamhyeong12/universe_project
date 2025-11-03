import React, { useState, useEffect, Suspense } from 'react';
// 💡 [새 라이브러리] Konva (2D 캔버스)
import { Stage, Layer, Rect, Text } from 'react-konva';

// =============================================================
// 💡 [Phase 3] 2D 픽셀 아트 캔버스
// - D-Lab 계획서의 "핵심 기능"
// - Konva.js 라이브러리를 사용
// - "가짜 데이터(Mock Data)"를 기반으로 UI를 먼저 구현 (Frontend-First)
// =============================================================

// 💡 "가짜 데이터" (백엔드 API가 아직 없으므로)
// 나중에 `fetch('GET /api/pixels?planet=...')`로 이 데이터를 받아올 것임
const MOCK_PIXELS = [
  { x: 0, y: 0, color: '#FF0000', owner: 'kimnamhyeong12' },
  { x: 0, y: 1, color: '#00FF00', owner: 'joyeongjun' },
  { x: 1, y: 0, color: '#0000FF', owner: 'joyeongjun' },
  { x: 1, y: 1, color: '#FFFFFF', owner: null }, // (소유주 없음)
  { x: 2, y: 0, color: '#FFFFFF', owner: null },
  { x: 2, y: 1, color: '#FFFFFF', owner: null },
  { x: 2, y: 2, color: '#FFFFFF', owner: null },
  { x: 0, y: 2, color: '#FFFFFF', owner: null },
  { x: 1, y: 2, color: '#FFFFFF', owner: null },
];
// 캔버스 크기 (예: 20x20 그리드)
const GRID_SIZE = 20; 
const PIXEL_SIZE = 30; // 픽셀 하나당 30px

/**
 * 🎨 색상 팔레트 (HTML)
 */
const ColorPalette = ({ selectedColor, onSelectColor }) => {
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFFFFF', '#000000'];
  return (
    <div className="absolute top-5 left-5 z-10 p-4 bg-black/50 backdrop-blur-sm rounded-lg flex gap-2">
      {colors.map(color => (
        <div
          key={color}
          className="w-10 h-10 rounded-full cursor-pointer border-2"
          style={{ 
            backgroundColor: color,
            borderColor: selectedColor === color ? '#00ffff' : 'transparent' // 💡 선택된 색상 테두리
          }}
          onClick={() => onSelectColor(color)}
        />
      ))}
    </div>
  );
};

/**
 * 🖼️ 픽셀 캔버스 (Konva.js)
 */
export default function PixelEditor() {
  // 💡 [상태 1] 현재 DB에 저장된 픽셀들
  const [pixels, setPixels] = useState(MOCK_PIXELS);
  // 💡 [상태 2] 내가 선택한 "브러시" 색상
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');

  // 픽셀 클릭(그리기) 이벤트
  const handlePixelClick = (clickedPixel) => {
    // 💡 (D-Lab 핵심)
    // 1. "소유권" 확인 (지금은 'joyeongjun'만 그릴 수 있게 하드코딩)
    if (clickedPixel.owner !== 'joyeongjun' && clickedPixel.owner !== null) {
       alert(`[${clickedPixel.owner}]님의 땅입니다. (그리기 실패)`);
       return;
    }
    
    // 2. 픽셀 색상 "업데이트" (React 상태 업데이트)
    const newPixels = pixels.map(p => 
      (p.x === clickedPixel.x && p.y === clickedPixel.y)
        ? { ...p, color: selectedColor } // 💡 클릭한 픽셀의 색상 변경
        : p
    );
    setPixels(newPixels);
    
    // 3. 💡 [나중의 일]
    // 백엔드에 이 변경사항을 "저장" (API 호출)
    // fetch('POST /api/pixels', { body: { x, y, color } })
    console.log(`[${clickedPixel.x}, ${clickedPixel.y}]에 ${selectedColor} 색상으로 그리기`);
  };

  return (
    <div className="w-screen h-screen bg-gray-800 relative">
      {/* 1. HTML UI (색상 팔레트) */}
      <ColorPalette selectedColor={selectedColor} onSelectColor={setSelectedColor} />

      {/* 2. 2D 캔버스 (Konva) */}
      <Stage 
        width={window.innerWidth} 
        height={window.innerHeight} 
        draggable // 💡 캔버스 이동(Pan)
        dragBoundFunc={(pos) => ({ x: pos.x, y: pos.y })} // 이동 제한 (옵션)
      >
        <Layer>
          {/* 💡 DB에서 불러온 픽셀들(.map) */}
          {pixels.map((pixel, i) => (
            <Rect
              key={i}
              x={pixel.x * PIXEL_SIZE} // 💡 2D 좌표
              y={pixel.y * PIXEL_SIZE}
              width={PIXEL_SIZE}
              height={PIXEL_SIZE}
              fill={pixel.color} // 💡 픽셀 색상
              stroke="#555" // 픽셀 그리드(격자)
              strokeWidth={1}
              onClick={() => handlePixelClick(pixel)} // 💡 클릭 이벤트
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
