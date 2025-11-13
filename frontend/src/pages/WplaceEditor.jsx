// src/pages/WplaceEditor.jsx
import React, { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PLANET_TEXTURES = {
  수성: "/textures/mercury.jpg",
  금성: "/textures/venus.jpg",
  지구: "/textures/earth.jpg",
  화성: "/textures/mars.jpg",
  목성: "/textures/jupiter.jpg",
  토성: "/textures/saturn.jpg",
  천왕성: "/textures/uranus.jpg",
  해왕성: "/textures/neptune.jpg",
  달: "/textures/moon.jpg",
};

// 🔹 1px 셀 (실제 그리기 단위)
const CELL_SIZE = 1;
// 🔹 화면에 보이는 격자 간격 (이미지 좌표 기준 px)
const GRID_STEP = 32;
// 🔹 최대 확대 배율 (너무 과한 확대 방지용, 필요 없으면 아주 크게 둠)
const MAX_SCALE = 128;

export default function WplaceEditor() {
  const { planet } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [color, setColor] = useState("#00ffff");
  const [image, setImage] = useState(null);
  const [pixels, setPixels] = useState([]); // {x, y, color} (이미지 좌표, 1px 단위)

  // pan & zoom
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // 화면 기준(px)
  const [scale, setScale] = useState(1);                // 확대 배율
  const [minScale, setMinScale] = useState(1);          // 최소 배율 = 처음 꽉 찬 상태

  const pan = useRef({ dragging: false, startX: 0, startY: 0 });

  // 행성 이미지 로드
  useEffect(() => {
    const img = new Image();
    img.src = PLANET_TEXTURES[planet] || PLANET_TEXTURES["지구"];
    img.onload = () => setImage(img);
  }, [planet]);

  // 캔버스 크기 조정 + 초기 배율/오프셋 세팅
  useEffect(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // 화면에 꽉 찌는 최소 배율
      const fitScale = Math.min(
        canvas.width / image.width,
        canvas.height / image.height
      );

      setScale(fitScale);
      setMinScale(fitScale);

      // 중앙 정렬
      setOffset({
        x: (canvas.width - image.width * fitScale) / 2,
        y: (canvas.height - image.height * fitScale) / 2,
      });
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [image]);

  // offset을 이미지 범위 안으로 클램프
  const clampOffset = (rawX, rawY, scl) => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return { x: rawX, y: rawY };

    const imgW = image.width * scl;
    const imgH = image.height * scl;

    // 이미지가 캔버스보다 작으면 가운데 정렬 유지
    const canW = canvas.width;
    const canH = canvas.height;

    let minX, maxX, minY, maxY;

    if (imgW <= canW) {
      const centerX = (canW - imgW) / 2;
      minX = maxX = centerX;
    } else {
      minX = canW - imgW;
      maxX = 0;
    }

    if (imgH <= canH) {
      const centerY = (canH - imgH) / 2;
      minY = maxY = centerY;
    } else {
      minY = canH - imgH;
      maxY = 0;
    }

    const x = Math.min(maxX, Math.max(minX, rawX));
    const y = Math.min(maxY, Math.max(minY, rawY));
    return { x, y };
  };

  // 렌더링
  useEffect(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🔥 흐려지지 않게(nearest-neighbor)
    ctx.imageSmoothingEnabled = false;

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // 행성 이미지
    ctx.drawImage(image, 0, 0);

    // 격자선 (GRID_STEP 간격)
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 255, 255, 0.18)";
    ctx.lineWidth = 1 / scale; // 확대해도 선 굵기 일정하게

    for (let x = 0; x <= image.width; x += GRID_STEP) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, image.height);
    }
    for (let y = 0; y <= image.height; y += GRID_STEP) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(image.width, y + 0.5);
    }
    ctx.stroke();

    // 칠해진 셀(1px 셀) 렌더링
    pixels.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, CELL_SIZE, CELL_SIZE);
    });

    ctx.restore();
  }, [image, pixels, offset, scale]);

  // ───── 마우스 이벤트 ─────

  const onMouseDown = (e) => {
    pan.current.dragging = true;
    pan.current.startX = e.clientX - offset.x;
    pan.current.startY = e.clientY - offset.y;
  };

  const onMouseMove = (e) => {
    if (!pan.current.dragging) return;
    const rawX = e.clientX - pan.current.startX;
    const rawY = e.clientY - pan.current.startY;
    const clamped = clampOffset(rawX, rawY, scale);
    setOffset(clamped);
  };

  const onMouseUp = () => {
    pan.current.dragging = false;
  };

  // 휠 줌 (커서 기준 확대/축소)
  const onWheel = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    let targetScale = scale * zoomFactor;

    if (targetScale < minScale) targetScale = minScale;
    if (targetScale > MAX_SCALE) targetScale = MAX_SCALE;

    const oldScale = scale;
    const newScale = targetScale;

    // 현재 마우스 위치의 월드 좌표(이미지 기준)
    const worldX = (mouseX - offset.x) / oldScale;
    const worldY = (mouseY - offset.y) / oldScale;

    // 새 배율에서 다시 화면으로 투영했을 때, 마우스 아래가 그대로 worldX/worldY가 되도록 offset 재계산
    const rawOffsetX = mouseX - worldX * newScale;
    const rawOffsetY = mouseY - worldY * newScale;
    const clamped = clampOffset(rawOffsetX, rawOffsetY, newScale);

    setScale(newScale);
    setOffset(clamped);
  };

  // 클릭 → 1px 셀 단위로 스냅해서 칠하기
  const onClick = (e) => {
    if (!image) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // pan/zoom 역변환 → 이미지 기준 좌표
    const worldX = (canvasX - offset.x) / scale;
    const worldY = (canvasY - offset.y) / scale;

    // 1px 셀 기준으로 스냅 (정수 좌표)
    const cellX = Math.floor(worldX / CELL_SIZE) * CELL_SIZE;
    const cellY = Math.floor(worldY / CELL_SIZE) * CELL_SIZE;

    if (
      cellX < 0 ||
      cellY < 0 ||
      cellX >= image.width ||
      cellY >= image.height
    ) {
      return;
    }

    setPixels((prev) => [...prev, { x: cellX, y: cellY, color }]);
  };

  return (
    <div style={{ background: "#000", overflow: "hidden" }}>
      {/* 상단 UI */}
      <div
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 10,
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            background: "#333",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          {planet} WPLACE Editor
        </div>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: "40px", height: "40px" }}
        />

        <button
          style={{
            padding: "10px 18px",
            background: "#00d4ff",
            borderRadius: "8px",
            fontWeight: "bold",
          }}
        >
          저장
        </button>

        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "10px 18px",
            background: "#444",
            color: "white",
            borderRadius: "8px",
          }}
        >
          돌아가기
        </button>
      </div>

      {/* 캔버스 */}
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100vw",
          height: "100vh",
          cursor: pan.current.dragging ? "grabbing" : "grab",
          imageRendering: "pixelated", // 🔥 CSS에서도 픽셀 느낌 유지
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onClick={onClick}
      />
    </div>
  );
}
