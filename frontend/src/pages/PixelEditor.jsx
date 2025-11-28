import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HexColorPicker, HexColorInput } from "react-colorful";
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
  const { token, nftId } = useParams();
  const isNftMode = !!nftId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const canvasRef = useRef(null);

  const [color, setColor] = useState("#00ffff");
  const [pixels, setPixels] = useState([]);
  const [history, setHistory] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [baseImg, setBaseImg] = useState(null);
  const [eraseMode, setEraseMode] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [planet, setPlanet] = useState("");
  const [cellId, setCellId] = useState("");
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);

  const [isListed, setIsListed] = useState(false); // NFT 판매중

  const [showMintModal, setShowMintModal] = useState(false);


  // ================================
  // Ctrl+Z Undo
  // ================================
  const undo = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setPixels(last);
      return prev.slice(0, -1);
    });
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pixels, history]);

  // ================================
  // 초기 데이터 불러오기
  // ================================
  useEffect(() => {
    async function load() {
      const jwt =
        localStorage.getItem("jwt") ||
        localStorage.getItem("celestia_token") ||
        localStorage.getItem("token");

      if (!jwt) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      try {
        if (!isNftMode) {
          // 기존 셀 편집 모드
          const res = await fetch(`/api/pixels/byToken/${token}`, {
            headers: { Authorization: `Bearer ${jwt}` },
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message);

          setPlanet(data.planetName);
          setCellId(data.cellId);
          setPixels(data.pixels || []);

        } else {
          // NFT 편집 모드
          const res = await fetch(`/api/nft/editor/${nftId}`, {
            headers: { Authorization: `Bearer ${jwt}` },
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message);

          setPlanet(data.planetName);
          setCellId(data.cellId);
          setPixels(data.pixels || []);
          setIsListed(data.isListed === true);
        }
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, nftId, isNftMode, navigate]);

  // ================================
  // 행성 이미지 로딩
  // ================================
  useEffect(() => {
    if (!planet) return;

    const img = new Image();
    img.src = planetImages[planet];

    img.onload = () => setBaseImg(img);
    img.onerror = () => console.error("행성 이미지 로드 실패:", img.src);
  }, [planet]);

  // ================================
  // 캔버스 렌더
  // ================================
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
    let targetH = CELL_PIXEL_W * PIXEL_SIZE * SCALE;
    let targetW = targetH * aspect;

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

    ctx.drawImage(baseImg, sx, sy, srcW, srcH, 0, 0, targetW, targetH);

    pixels.forEach(({ x, y, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        x * (targetW / CELL_PIXEL_W),
        y * (targetH / CELL_PIXEL_H),
        targetW / CELL_PIXEL_W,
        targetH / CELL_PIXEL_H
      );
    });

    ctx.strokeStyle = "rgba(0,255,255,0.15)";
    for (let gx = 0; gx <= CELL_PIXEL_W; gx++) {
      ctx.beginPath();
      ctx.moveTo((gx * targetW) / CELL_PIXEL_W, 0);
      ctx.lineTo((gx * targetW) / CELL_PIXEL_W, targetH);
      ctx.stroke();
    }
    for (let gy = 0; gy <= CELL_PIXEL_H; gy++) {
      ctx.beginPath();
      ctx.moveTo(0, (gy * targetH) / CELL_PIXEL_H);
      ctx.lineTo(targetW, (gy * targetH) / CELL_PIXEL_H);
      ctx.stroke();
    }
  }, [baseImg, pixels, planet, cellId, canvasSize]);

  // ================================
  // 저장하기 (일반 + NFT 공용)
  // ================================
  const handleSave = async () => {
    const jwt =
      localStorage.getItem("jwt") ||
      localStorage.getItem("celestia_token") ||
      localStorage.getItem("token");

    if (!jwt) return alert("로그인이 필요합니다.");

    // ---------------------------
    // NFT 편집 모드
    // ---------------------------
    if (isNftMode) {
      if (isListed) return alert("판매중인 NFT는 수정할 수 없습니다.");

      const canvas = canvasRef.current;
      const imageDataUrl = canvas.toDataURL("image/png");

      try {
        const res = await fetch(`/api/nft/update/${nftId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({ pixels, imageDataUrl }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        alert("NFT 수정 저장 완료!");
        navigate("/mypage");
        return;
      } catch (err) {
        alert("NFT 저장 실패");
        return;
      }
    }

    // ---------------------------
    // 기존 셀 저장
    // ---------------------------
    try {
      const res = await fetch("/api/pixels/saveByToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ token, pixels }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("저장 완료!");
    } catch (err) {
      alert("서버 오류 발생");
    }
  };

  // ================================
  // NFT 발행 (상점 등록)
  // ================================
  const handleMintNFT = async () => {
    const jwt =
      localStorage.getItem("jwt") ||
      localStorage.getItem("celestia_token") ||
      localStorage.getItem("token");

    if (!jwt) return alert("로그인이 필요합니다.");

    const canvas = canvasRef.current;
    const imageDataUrl = canvas.toDataURL("image/png");

    setMinting(true);

    try {
      const res = await fetch("/api/nft/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          token,
          planetName: planet,
          cellId,
          pixels,
          imageDataUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("🎉 NFT 발행이 완료되었습니다!");

      // ⭐ 자동 이동
      navigate("/mypage");

    } catch (err) {
      alert("NFT 발행 실패");
    } finally {
      setMinting(false);
    }
  };


  // ================================
  // 드로잉
  // ================================
  const drawAt = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * CELL_PIXEL_W);
    const y = Math.floor(((clientY - rect.top) / rect.height) * CELL_PIXEL_H);
    if (x < 0 || x >= CELL_PIXEL_W || y < 0 || y >= CELL_PIXEL_H) return;

    setPixels((prev) => {
      const idx = prev.findIndex((p) => p.x === x && p.y === y);

      if (eraseMode) {
        if (idx >= 0) {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        }
        return prev;
      }

      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { x, y, color };
        return next;
      }

      return [...prev, { x, y, color }];
    });
  };

  const handleMouseDown = (e) => {
    if (isNftMode && isListed) return;
    setHistory((prev) => [...prev, pixels.map((p) => ({ ...p }))]);
    setIsDrawing(true);
    drawAt(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    if (isNftMode && isListed) return;
    drawAt(e.clientX, e.clientY);
  };

  const handleMouseUp = () => setIsDrawing(false);

  // ================================
  // 초기화
  // ================================
  const handleClear = () => {
    if (isNftMode && isListed) return;
    if (!window.confirm("정말 초기화할까요?")) return;
    setHistory((p) => [...p, pixels.map((v) => ({ ...v }))]);
    setPixels([]);
  };

  // ================================
  // UI
  // ================================
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-cyan-300 text-lg">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center">

      {/* ======================== NFT 발행 경고 모달 ======================== */}
      {showMintModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="rounded-xl bg-[#0b1622] border border-cyan-400/30 shadow-lg w-[420px] p-8">
            <div className="text-xl font-bold mb-4">NFT 발행하기</div>

            <p className="text-white/80 mb-4 leading-relaxed">
              NFT로 발행하면 이 셀은 더 이상 일반 소유 행성 목록에 나타나지 않습니다.
              <br /><br />
              또한 NFT는 시장에서 거래 가능한 자산으로 전환됩니다.
              <br />
              계속 진행할까요?
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowMintModal(false);
                  handleMintNFT();  // 🔥 진짜 발행
                }}
                className="btn btn-primary w-full"
              >
                네, 발행합니다
              </button>

              <button
                onClick={() => setShowMintModal(false)}
                className="btn btn-secondary w-full"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
      <h2 className="text-2xl font-bold mb-6">
        {planet} — {cellId} 구역 편집
      </h2>

      <div className="flex items-center justify-center gap-10">
        {/* 왼쪽 버튼 */}
        <div className="flex flex-col gap-4">
          {isNftMode && isListed && (
            <div className="text-red-400 font-bold text-center mb-4">
              이 NFT는 판매중이라 수정 불가
            </div>
          )}

          {/* 저장하기 (NFT + 일반 공용) */}
          <button
            onClick={handleSave}
            className="btn btn-outline w-28 h-12"
            disabled={isNftMode && isListed}
          >
            저장하기
          </button>

          {/* NFT 발행 */}
          {!isNftMode && (
            <button
              onClick={() => setShowMintModal(true)}
              className="btn btn-outline w-28 h-12"
              disabled={minting}
            >
              NFT 발행하기
            </button>

          )}

          <button
            onClick={() => navigate("/mypage")}
            className="btn btn-outline w-28 h-12"
          >
            돌아가기
          </button>

          {/* 초기화 */}
          <button
            onClick={handleClear}
            className="btn btn-outline w-28 h-12"
            disabled={isNftMode && isListed}
          >
            초기화
          </button>
        </div>

        {/* 캔버스 */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            border: "1px solid cyan",
            cursor:
              isNftMode && isListed
                ? "not-allowed"
                : eraseMode
                ? "not-allowed"
                : "crosshair",
            display: "block",
            width: `${canvasSize.w}px`,
            height: `${canvasSize.h}px`,
            imageRendering: "pixelated",
          }}
        />

        {/* 오른쪽 컬러선택 */}
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
              eraseMode
                ? "bg-red-500 text-white"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {eraseMode ? "지우개 ON" : "지우개 OFF"}
          </button>
        </div>
      </div>
    </div>
  );
}
