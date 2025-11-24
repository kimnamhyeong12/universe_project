import React, { useEffect, useState } from "react";

export default function CellDetailPanel({ cell, planet, onClose }) {
  const [likes, setLikes] = useState(cell.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [cropUrl, setCropUrl] = useState(null);

  // ===== JWT 에서 userId 뽑기 (안전하게) =====
  const token = localStorage.getItem("celestia_token");
  let userId = null;
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload?.id;
    }
  } catch (e) {
    console.warn("토큰 파싱 오류:", e);
  }

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

  const GRID_W = 10;
  const GRID_H = 10;
  const CELL_PIXEL_W = 50;
  const CELL_PIXEL_H = 50;

  // ✅ 처음 들어왔을 때 내가 이미 좋아요 눌렀는지
  useEffect(() => {
    if (userId && cell.likedBy?.includes(userId)) {
      setIsLiked(true);
    }
  }, [cell, userId]);

  // ✅ 좋아요 토글
  async function toggleLike() {
    if (!token) {
      alert("좋아요는 로그인 후 가능합니다.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/pixels/${cell._id}/like`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        console.error("좋아요 오류:", data);
        return;
      }
      setLikes(data.likes);
      setIsLiked(data.isLiked);
    } catch (err) {
      console.error("좋아요 요청 실패:", err);
    }
  }

  // ============================================
  // ⭐ 선택한 셀 영역 + 내가 찍은 픽셀까지 같이 그리기
  // ============================================
  useEffect(() => {
    const baseSrc = planetImages[planet];
    if (!baseSrc) return;

    const img = new Image();
    img.src = baseSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const cellW = img.width / GRID_W;
      const cellH = img.height / GRID_H;

      const [cx, cy] = cell.cellId.split("-").map(Number);

      // 셀을 3배 확대해서 보여주기
      const scale = 3;
      canvas.width = cellW * scale;
      canvas.height = cellH * scale;

      // 1) 행성 텍스처에서 해당 셀 부분 잘라서 그림
      ctx.drawImage(
        img,
        cx * cellW,
        cy * cellH,
        cellW,
        cellH,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // 2) 그 위에 내가 찍은 픽셀 덮어쓰기
      const pxW = canvas.width / CELL_PIXEL_W;
      const pxH = canvas.height / CELL_PIXEL_H;

      (cell.pixels || []).forEach((p) => {
        ctx.fillStyle = p.color || "#00ffff";
        ctx.fillRect(p.x * pxW, p.y * pxH, pxW, pxH);
      });

      setCropUrl(canvas.toDataURL());
    };
  }, [cell, planet]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      {/* 중앙 패널 전체 박스 */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "1100px",
          height: "600px",
          background: "rgba(20,20,20,0.95)",
          border: "2px solid cyan",
          borderRadius: "10px",
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* =============================== */}
        {/* 🔵 왼쪽: 선택한 셀 (훨씬 크게)     */}
        {/* =============================== */}
        <div
          style={{
            flex: 7, // ← 왼쪽 더 넓게 (대략 70%)
            background: "black",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRight: "2px solid cyan",
          }}
        >
          {cropUrl ? (
            <img
              src={cropUrl}
              alt="cell-preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain", // 비율 유지하면서 꽉 차게
              }}
            />
          ) : (
            <div style={{ color: "gray" }}>이미지 불러오는 중...</div>
          )}
        </div>

        {/* =============================== */}
        {/* 🔵 오른쪽: 정보 / 소유주 / 인기도 */}
        {/* =============================== */}
        <div
          style={{
            flex: 3, // ← 오른쪽은 좁게 (대략 30%)
            padding: "24px",
            color: "white",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "14px",
              right: "18px",
              fontSize: "26px",
              cursor: "pointer",
            }}
          >
            ❌
          </button>

          <h2
            style={{
              fontSize: "28px",
              marginBottom: "18px",
            }}
          >
            {planet} — {cell.cellId}
          </h2>

          <div style={{ marginBottom: "32px", fontSize: "18px" }}>
            <b>소유주:</b> {cell.ownerName}
          </div>

          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <button
              onClick={toggleLike}
              style={{
                background: "none",
                border: "none",
                fontSize: "70px",
                cursor: "pointer",
              }}
            >
              {isLiked ? "💖" : "🤍"}
            </button>
            <div style={{ marginTop: "14px", fontSize: "22px" }}>
              인기도: {likes}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
