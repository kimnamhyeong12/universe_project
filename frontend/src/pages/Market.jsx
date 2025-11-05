import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext"; // 🔑 전역 인증 상태 불러오기
import "./Market.css"; // 🎨 마켓 스타일 불러오기

// =============================================================
// 6) 마켓 페이지 컴포넌트
// =============================================================
export default function Market({ onBackClick }) {
  const { user } = useAuth(); // 🔑 현재 로그인한 사용자 정보 (token 포함)
  const [assets, setAssets] = useState([]); // 🔭 판매 중인 자산들
  const [loading, setLoading] = useState(true); // ⏳ 로딩 상태

  // 🔄 마켓 자산 로딩
  useEffect(() => {
    async function fetchMarket() {
      try {
        const res = await fetch("http://localhost:5000/api/market");
        const data = await res.json();

        // 🎯 모든 자산 배열에 타입을 명시해 통합
        const all = [
          ...data.planets.map((a) => ({ ...a, type: "Planet" })),
          ...data.stars.map((a) => ({ ...a, type: "Star" })),
          ...data.galaxies.map((a) => ({ ...a, type: "Galaxy" })),
          ...data.blackholes.map((a) => ({ ...a, type: "Blackhole" })),
        ];
        setAssets(all); // 🎉 자산 저장
      } catch (err) {
        console.error("❌ 마켓 데이터 불러오기 실패:", err);
      } finally {
        setLoading(false); // ✅ 로딩 완료
      }
    }

    fetchMarket();
  }, []);

  // 💰 자산 구매 요청
  const handleBuy = async (type, id, name) => {
    if (!user || !user.token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/market/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`, // 🔐 사용자 토큰 전달
        },
        body: JSON.stringify({ assetType: type, assetId: id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "구매 요청 실패");

      alert(`✅ ${name} 구매 요청이 성공적으로 접수되었습니다.`);
    } catch (err) {
      console.error(err);
      alert("❌ 구매 요청 실패");
    }
  };

  // 📦 렌더링
  return (
    <div className="market-page">
      <h1>🌌 Universe Market</h1>

      {/* 🔙 우주로 돌아가는 버튼 */}
      <button className="back-btn" onClick={onBackClick}>
        ← 우주로 돌아가기
      </button>

      {/* ⏳ 로딩 / ❌ 자산 없음 / ✅ 자산 목록 */}
      {loading ? (
        <p className="loading">Loading market assets...</p>
      ) : assets.length === 0 ? (
        <p className="no-assets">판매 중인 자산이 없습니다.</p>
      ) : (
        <div className="market-grid">
          {assets.map((asset) => (
            <div key={asset._id} className="item-card">
              {/* 자산 이미지 */}
              <img
                src={asset.imageUrl || "/default_space.jpg"}
                alt={asset.name}
                className="item-image"
              />

              {/* 자산 정보 */}
              <div className="item-info">
                <div className="item-type">{asset.type}</div>
                <div className="item-name">{asset.name}</div>
                {asset.price && (
                  <div className="item-price">
                    {asset.price.toLocaleString()} KRW
                  </div>
                )}
                {/* 💸 구매 버튼 */}
                <button
                  className="buy-btn"
                  onClick={() => handleBuy(asset.type, asset._id, asset.name)}
                >
                  구매하기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
