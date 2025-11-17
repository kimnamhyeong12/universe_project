// ✅ src/components/PurchasePanel.jsx
import React, { useState, useEffect } from "react";
import "../styles/celestia-styles.css";

export default function PurchasePanel({ data, onBack, onBuy }) {
  const [selectedCells, setSelectedCells] = useState([]);
  const [purchasedCells, setPurchasedCells] = useState([]);
  const [pointBalance, setPointBalance] = useState(0); // 🔥 내 포인트 표시 추가

  const pricePerCell = data?.price || 1000;
  const totalCost = selectedCells.length * pricePerCell;

  // -------------- 🔥 내 포인트 불러오기 -----------------
  useEffect(() => {
    async function loadBalance() {
      const token = localStorage.getItem("celestia_token");  
      if (!token) return;

      const res = await fetch("http://localhost:5000/api/points/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setPointBalance(data.balance || 0);
    }

    loadBalance();
  }, []);

  // -------------- 기존 구매내역 불러오기 -----------------
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

  // -------- 셀 생성 ----------
  const gridSize = 10;
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

  const cells = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const id = `${x}-${y}`;
      cells.push({ id, x, y });
    }
  }

  // -------- 셀 선택 ----------
  const handleCellClick = (cell) => {
    if (purchasedCells.includes(cell.id)) return;

    setSelectedCells((prev) =>
      prev.includes(cell.id)
        ? prev.filter((id) => id !== cell.id)
        : [...prev, cell.id]
    );
  };

  const handlePurchase = () => {
    if (selectedCells.length === 0) return;

    onBuy({ ...data, selectedCells });
  };

  const insufficient = pointBalance - totalCost < 0;

  // -------- UI ----------
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
        {/* HEADER */}
        <div className="flex justify-between items-center w-full mb-3">
          <div>
            <div className="text-xs text-cyan-200/70 uppercase tracking-widest">
              PURCHASE VIEW
            </div>

            <div className="text-2xl font-extrabold text-white drop-shadow flex items-center gap-3">
              {data?.name || "행성"}

              {insufficient && selectedCells.length > 0 && (
                <span className="text-red-400 text-sm font-semibold">
                  (포인트 부족)
                </span>
              )}
            </div>
          </div>

          <button
            className="text-cyan-300 hover:text-cyan-100 text-lg font-semibold"
            onClick={onBack}
          >
            ✖ 닫기
          </button>
        </div>

        {/* 🔥 내 포인트 / 차감 / 남을 포인트 3분할 박스 */}
        <div className="w-full mb-4 p-4 rounded-lg bg-black/30 border border-cyan-500/20 flex justify-between gap-4">
          
          {/* 1) 내 보유 포인트 */}
          <div className="flex-1">
            <div className="text-sm text-cyan-200/70">내 보유 포인트</div>
            <div className="text-xl font-bold text-cyan-300">
              {pointBalance.toLocaleString()} P
            </div>
          </div>

          {/* 2) 이번 구매 차감 예정 */}
          <div className="flex-1 text-center">
            <div className="text-sm text-cyan-200/70">이번 구매 차감 예정</div>
            <div
              className="text-xl font-bold"
              style={{
                color: pointBalance >= totalCost ? "#FFD369" : "#FF4E78",
              }}
            >
              - {totalCost.toLocaleString()} P
            </div>
          </div>

          {/* 3) 구매 후 예상 잔액 */}
          <div className="flex-1 text-right">
            <div className="text-sm text-cyan-200/70">구매 후 예상 잔액</div>
            <div
              className="text-xl font-bold"
              style={{
                color: insufficient ? "#FF4E78" : "#7CFFB2",
              }}
            >
              {(pointBalance - totalCost).toLocaleString()} P
            </div>
          </div>

        </div>

        {/* 안내문 */}
        <p className="text-cyan-200/80 mb-3 text-center">
          원하는 구역을 클릭하여 구매하세요. 각 구역은 독립적으로 소유됩니다.
        </p>

        {/* 지도 */}
        <div
          className="relative border border-white/20 rounded-xl overflow-hidden mb-5"
          style={{
            width: "720px",
            height: "360px",
            backgroundImage: `url(${imgSrc})`,
            backgroundSize: "contain",
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
            disabled={selectedCells.length === 0 || insufficient}
            style={{
              opacity: selectedCells.length === 0 || insufficient ? 0.5 : 1,
              cursor:
                selectedCells.length === 0 || insufficient
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            구매하기
          </button>

          <button className="btn-neo btn-neo--lg px-6 py-2" onClick={onBack}>
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
