// ✅ src/components/PurchasePanel.jsx
import React, { useState, useEffect } from "react";
import "../styles/celestia-styles.css";

export default function PurchasePanel({ data, onBack, onBuy }) {
  const [selectedCells, setSelectedCells] = useState([]);
  const [purchasedCells, setPurchasedCells] = useState([]);

  // ✅ 한글 행성 이름 → 이미지 파일 매핑
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

  const imgSrc = planetImages[data?.name] || "/textures/planet_default.jpg";
  const gridSize = 10; // ✅ ViewPlanet과 동일한 GRID_W, GRID_H

  // ✅ 행성의 기존 구매 내역 불러오기
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/purchase/${data.name}`);
        const purchases = await res.json();
        const cellIds = purchases.map((p) => p.cellId);
        setPurchasedCells(cellIds);
      } catch (err) {
        console.error("❌ 구매 정보 불러오기 실패:", err);
      }
    };

    const lastPlanet = localStorage.getItem("lastPlanet");
    if (lastPlanet === data?.name) {
      localStorage.removeItem("lastPlanet");
      localStorage.removeItem("lastCells");
      setTimeout(fetchPurchases, 1000);
    } else if (data?.name) {
      fetchPurchases();
    }
  }, [data]);

  // ✅ 셀 생성
  const cells = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const id = `${x}-${y}`;
      cells.push({ id, x, y });
    }
  }

  // ✅ 셀 클릭
  const handleCellClick = (cell) => {
    if (purchasedCells.includes(cell.id)) return;
    setSelectedCells((prev) =>
      prev.includes(cell.id)
        ? prev.filter((id) => id !== cell.id)
        : [...prev, cell.id]
    );
  };

  // ✅ 구매 확정
  const handlePurchase = () => {
    if (selectedCells.length === 0)
      return alert("먼저 구매할 영역을 선택하세요!");

    localStorage.setItem("lastPlanet", data.name);
    localStorage.setItem("lastCells", JSON.stringify(selectedCells));

    onBuy({ ...data, selectedCells });
  };

  // ✅ 비율 맞춘 지도 크기 (2:1 비율 유지)
  const mapWidth = 720;
  const mapHeight = 360;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="card-glass text-cyan-100 rounded-2xl shadow-xl border border-cyan-500/30"
        style={{
          width: "780px",
          padding: "24px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center w-full mb-3">
          <div>
            <div className="text-xs text-cyan-200/70 uppercase tracking-widest">
              PURCHASE VIEW
            </div>
            <div className="text-2xl font-extrabold text-white drop-shadow">
              {data?.name || "행성"}
            </div>
          </div>
          <button
            className="text-cyan-300 hover:text-cyan-100 text-lg font-semibold"
            onClick={onBack}
          >
            ✖ 닫기
          </button>
        </div>

        {/* 안내문 */}
        <p className="text-cyan-200/80 mb-3 text-center">
          원하는 구역을 클릭하여 구매하세요. 각 구역은 독립적으로 소유할 수 있습니다.
        </p>

        {/* 🌍 지도 */}
        <div
          className="relative border border-white/20 rounded-xl overflow-hidden mb-5"
          style={{
            width: `${mapWidth}px`,
            height: `${mapHeight}px`,
            backgroundImage: `url(${imgSrc})`,
            backgroundSize: "contain", // ✅ 비율 유지 (중요!)
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            display: "grid",
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          }}
        >
          {cells.map((cell) => {
            const isPurchased = purchasedCells.includes(cell.id);
            const isSelected = selectedCells.includes(cell.id);

            return (
              <div
                key={cell.id}
                onClick={() => handleCellClick(cell)}
                style={{
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  backgroundColor: isPurchased
                    ? "rgba(180,180,180,0.45)"
                    : isSelected
                    ? "rgba(0,255,255,0.3)"
                    : "transparent",
                  cursor: isPurchased ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                }}
              />
            );
          })}
        </div>

        {/* 버튼 */}
        <div className="flex gap-4 justify-center">
          <button
            className="btn-neo btn-neo--lg px-6 py-2"
            onClick={handlePurchase}
            disabled={selectedCells.length === 0}
          >
            구매하기
          </button>
          <button
            className="btn-neo btn-neo--lg px-6 py-2"
            onClick={onBack}
          >
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
