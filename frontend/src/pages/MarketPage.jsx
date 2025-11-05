// src/pages/MarketPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";  // 🔑 전역 인증
import "../styles/Market.css";                      // 🎨 마켓 스타일

export default function MarketPage() {
  const nav = useNavigate();
  const { user } = useAuth();          // { token, username, ... }
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 마켓 자산 로딩
  useEffect(() => {
    async function fetchMarket() {
      try {
        const res = await fetch("http://localhost:5000/api/market");
        const data = await res.json();

        const all = [
          ...(data.planets || []).map((a) => ({ ...a, type: "Planet" })),
          ...(data.stars || []).map((a) => ({ ...a, type: "Star" })),
          ...(data.galaxies || []).map((a) => ({ ...a, type: "Galaxy" })),
          ...(data.blackholes || []).map((a) => ({ ...a, type: "Blackhole" })),
        ];
        setAssets(all);
      } catch (err) {
        console.error("❌ 마켓 데이터 불러오기 실패:", err);
      } finally {
        setLoading(false);
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
          Authorization: `Bearer ${user.token}`,
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

  return (
    <div className="market-page">
      <h1>🌌 Universe Market</h1>

      {/* 🔙 네비게이션 버튼들 */}
      <div className="mt-8 flex gap-12">
        <button className="btn-outline" onClick={() => nav(-1)}>뒤로가기</button>
        <button className="btn-glow" onClick={() => nav("/universe")}>우주 들어가기</button>
      </div>

      {/* ⏳ 로딩 / ❌ 자산 없음 / ✅ 자산 목록 */}
      {loading ? (
        <p className="loading">Loading market assets...</p>
      ) : assets.length === 0 ? (
        <p className="no-assets">판매 중인 자산이 없습니다.</p>
      ) : (
        <div className="market-grid">
          {assets.map((asset) => (
            <div key={asset._id} className="item-card">
              <img
                src={asset.imageUrl || "/default_space.jpg"}
                alt={asset.name}
                className="item-image"
              />
              <div className="item-info">
                <div className="item-type">{asset.type}</div>
                <div className="item-name">{asset.name}</div>
                {asset.price && (
                  <div className="item-price">
                    {asset.price.toLocaleString()} KRW
                  </div>
                )}
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
