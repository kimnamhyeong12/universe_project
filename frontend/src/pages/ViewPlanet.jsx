import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import CellDetailPanel from "./CellDetailPanel";

const GRID_W = 10;
const GRID_H = 10;
const CELL_PIXEL_W = 50;
const CELL_PIXEL_H = 50;

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
  const [hoverInfo, setHoverInfo] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [zoomMin, setZoomMin] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const firstRender = useRef(true);

  const VIEW_W = 1200;
  const VIEW_H = 600;

  // ============================================================
  // 🔥 좋아요 업데이트 → 부모 pixelData 반영
  // ============================================================
  const handleLikeUpdate = (pixelId, newLikes, newLikedBy) => {
    setPixelData((prev) =>
      prev.map((cell) =>
        cell._id === pixelId
          ? { ...cell, likes: newLikes, likedBy: newLikedBy }
          : cell
      )
    );

    setSelectedCell((prev) =>
      prev && prev._id === pixelId
        ? { ...prev, likes: newLikes, likedBy: newLikedBy }
        : prev
    );
  };

  // 🔥 픽셀 데이터 로딩
  useEffect(() => {
    async function load() {
      const res = await fetch(`http://localhost:5000/api/pixels/planet/${planet}`);
      const data = await res.json();
      setPixelData(data);
    }
    load();
  }, [planet]);

  function clampPan(px, py) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: px, y: py };

    const cw = canvas.width;
    const ch = canvas.height;

    const minX = Math.min(0, VIEW_W - cw);
    const minY = Math.min(0, VIEW_H - ch);

    return {
      x: Math.min(0, Math.max(px, minX)),
      y: Math.min(0, Math.max(py, minY)),
    };
  }

  // 캔버스 렌더링
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = planetImages[planet];

    img.onload = () => {
      let autoZoom = zoom;

      if (firstRender.current && zoom === 1) {
        const scaleW = VIEW_W / img.width;
        const scaleH = VIEW_H / img.height;
        autoZoom = Math.min(scaleW, scaleH);

        setZoom(autoZoom);
        setZoomMin(autoZoom);
      }

      const baseW = img.width * autoZoom;
      const baseH = img.height * autoZoom;

      canvas.width = baseW;
      canvas.height = baseH;

      ctx.drawImage(img, 0, 0, baseW, baseH);

      if (firstRender.current) {
        setPan({
          x: (VIEW_W - baseW) / 2,
          y: (VIEW_H - baseH) / 2,
        });
        firstRender.current = false;
      }

      const cellW = baseW / GRID_W;
      const cellH = baseH / GRID_H;

      pixelData.forEach((cell) => {
        const [cx, cy] = cell.cellId.split("-").map(Number);
        const sx = cx * cellW;
        const sy = cy * cellH;

        const pxW = cellW / CELL_PIXEL_W;
        const pxH = cellH / CELL_PIXEL_H;

        (cell.pixels || []).forEach((p) => {
          ctx.fillStyle = p.color;
          ctx.fillRect(
            sx + p.x * pxW,
            sy + p.y * pxH,
            pxW,
            pxH
          );
        });
      });
    };
  };

  useEffect(drawCanvas, [zoom, pixelData]);

  const handleWheel = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let newZoom = zoom + (e.deltaY > 0 ? -0.1 : 0.1);
    newZoom = Math.max(zoomMin, Math.min(newZoom, 4));

    const zoomRatio = newZoom / zoom;
    setZoom(newZoom);

    setTimeout(() => {
      const newPanX = pan.x - (mouseX * zoomRatio - mouseX);
      const newPanY = pan.y - (mouseY * zoomRatio - mouseY);
      setPan(clampPan(newPanX, newPanY));
    }, 0);
  };

  const onMouseDown = (e) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  };

  const onMouseUp = (e) => {
    dragging.current = false;
    const dx = Math.abs(e.clientX - dragStart.current.x);
    const dy = Math.abs(e.clientY - dragStart.current.y);
    if (dx < 5 && dy < 5) handleCellClick(e);
  };

  function handleCellClick(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const realX = e.clientX - rect.left;
    const realY = e.clientY - rect.top;

    const cellW = canvas.width / GRID_W;
    const cellH = canvas.height / GRID_H;

    const cx = Math.floor(realX / cellW);
    const cy = Math.floor(realY / cellH);

    const id = `${cx}-${cy}`;

    const cell = pixelData.find((p) => p.cellId === id);

    if (!cell) return;

    setSelectedCell(cell);
  }

  const onMouseMove = (e) => {
    if (dragging.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPan(clampPan(panStart.current.x + dx, panStart.current.y + dy));
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const realX = e.clientX - rect.left;
    const realY = e.clientY - rect.top;

    if (realX < 0 || realY < 0 || realX > canvas.width || realY > canvas.height) {
      setHoverInfo(null);
      return;
    }

    const cellW = canvas.width / GRID_W;
    const cellH = canvas.height / GRID_H;

    const cx = Math.floor(realX / cellW);
    const cy = Math.floor(realY / cellH);

    const id = `${cx}-${cy}`;
    const cell = pixelData.find((p) => p.cellId === id);

    if (!cell || !cell.ownerName) return setHoverInfo(null);

    setHoverInfo({
      owner: cell.ownerName,
      cellId: id,
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <div className="flex flex-col items-center bg-black min-h-screen text-white pb-2">

      <h1 className="text-4xl mt-2">{planet} 구경하기 🌍</h1>

      <div
        style={{
          width: VIEW_W,
          height: VIEW_H,
          overflow: "hidden",
          border: "2px solid cyan",
          position: "relative",
        }}
        onWheel={handleWheel}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            left: pan.x,
            top: pan.y,
            imageRendering: "pixelated",
          }}
        />
      </div>

      {hoverInfo && (
        <div
          className="fixed px-2 py-1 bg-black/80 border border-cyan-400 rounded text-cyan-200"
          style={{ top: hoverInfo.y + 10, left: hoverInfo.x + 10 }}
        >
          <b>{hoverInfo.owner}</b>
          <div>{hoverInfo.cellId}</div>
        </div>
      )}

      <div className="mt-4 flex gap-4">
        <Link to="/universe" className="btn-neo btn-neo--lg">
          🌌 우주
        </Link>
        <Link to="/market" className="btn-neo btn-neo--lg">
          🛒 마켓
        </Link>
      </div>

      {/* 오른쪽 패널 */}
      {selectedCell && (
        <CellDetailPanel
          cell={selectedCell}
          planet={planet}
          onClose={() => setSelectedCell(null)}
          onLikeUpdate={handleLikeUpdate}   // ★ 중요: 좋아요 반영
        />
      )}
    </div>
  );
}
