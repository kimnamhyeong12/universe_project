// src/components/PurchasePanel.jsx
import React, { useState, useEffect } from "react";
import "../styles/celestia-styles.css";

export default function PurchasePanel({ data, onBack }) {
  const [selectedCells, setSelectedCells] = useState([]); // 선택한 칸들
  const [purchasedCells, setPurchasedCells] = useState([]); // 이미 구매된 칸들

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
  const gridSize = 10; // 10x10 그리드

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
    if (data?.name) fetchPurchases();
  }, [data]);

  // ✅ 그리드 생성
  const cells = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const id = `${x}-${y}`;
      cells.push({ id, x, y });
    }
  }

  // ✅ 셀 클릭 시
  const handleCellClick = (cell) => {
    if (purchasedCells.includes(cell.id)) return; // 이미 구매된 칸은 클릭 불가

    setSelectedCells((prev) =>
      prev.includes(cell.id)
        ? prev.filter((id) => id !== cell.id) // 다시 클릭 → 해제
        : [...prev, cell.id] // 새로 클릭 → 추가
    );
  };

  // ✅ 구매 확정 버튼
  const handlePurchase = async () => {
    if (selectedCells.length === 0)
      return alert("먼저 구매할 영역을 선택하세요!");

    try {
      const token =
        localStorage.getItem("jwt") ||
        localStorage.getItem("token") ||
        localStorage.getItem("celestia_token");
      if (!token) return alert("로그인 후 구매할 수 있습니다.");

      const res = await fetch("http://localhost:5000/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planetName: data.name,
          cells: selectedCells,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "구매 실패");
        return;
      }

      // ✅ 구매 완료된 칸 반영
      setPurchasedCells((prev) => [...prev, ...selectedCells]);
      setSelectedCells([]);

      alert(`✅ ${data.name}의 ${selectedCells.length}개 구역 구매 완료!`);
    } catch (error) {
      console.error(error);
      alert("서버 오류가 발생했습니다!");
    }
  };

  return (
    <div className="absolute right-8 top-20 z-30">
      <div className="card-glass w-[640px] p-6 text-cyan-100">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-cyan-200/70 uppercase tracking-widest">
              PURCHASE VIEW
            </div>
            <div className="text-2xl font-extrabold text-white drop-shadow">
              {data?.name || "행성"}
            </div>
          </div>
          <button className="btn-ghost" onClick={onBack}>
            닫기 ✖
          </button>
        </div>

        <p className="text-cyan-200/80 mb-4">
          원하는 구역을 클릭하여 구매하세요. 각 구역은 독립적으로 소유할 수 있습니다.
        </p>

        {/* 🌍 행성 이미지 + 격자 */}
        <div
          className="relative border border-white/20 rounded-lg overflow-hidden"
          style={{
            width: "600px",
            height: "300px",
            backgroundImage: `url(${imgSrc})`,
            backgroundSize: "cover",
            display: "grid",
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize / 2}, 1fr)`,
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
                  border: "0.5px solid rgba(255,255,255,0.07)",
                  backgroundColor: isPurchased
                    ? "rgba(100,100,100,0.5)" // 회색 = 이미 구매됨
                    : isSelected
                    ? "rgba(0,255,255,0.25)" // 청록색 = 이번에 선택됨
                    : "transparent",
                  cursor: isPurchased ? "not-allowed" : "pointer",
                  transition: "background-color 0.15s",
                }}
              />
            );
          })}
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-3 mt-5">
          <button className="btn-neo btn-neo--lg" onClick={handlePurchase}>
            구매 확정
          </button>
          <button className="btn-neo btn-neo--lg" onClick={onBack}>
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
