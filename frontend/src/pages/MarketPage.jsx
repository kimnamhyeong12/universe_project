// ✅ src/pages/MarketPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Market.css";
import PurchasePanel from "../components/PurchasePanel";
import Modal from "../components/Modal"; // ✅ 기존 Modal 재활용

export default function MarketPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // 자산 목록 및 상태
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // 구매 및 결제창 상태
  const [showPurchase, setShowPurchase] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // ✅ 1. Universe에서 state로 전달된 자산 자동 인식
  const { asset } = location.state || {};

  useEffect(() => {
    if (asset) {
      setSelectedAsset(asset);
      setShowPurchase(true);
    }
  }, [asset]);

  // ✅ 2. 마켓 자산 불러오기
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

  // ✅ 3. 구매 버튼 클릭 (Market 내부용)
  const handleBuy = (type, id, name, price, imageUrl) => {
    if (!user || !user.token) {
      alert("로그인이 필요합니다.");
      return;
    }

    setSelectedAsset({
      _id: id,
      name,
      type,
      price: price || 1000,
      imageUrl,
    });
    setShowPurchase(true);
  };

  return (
    <div className="market-page">
      <h1>🌌 Universe Market</h1>

      {/* 🔙 상단 버튼 (수정됨) */}
      <div className="mt-8 flex justify-between items-center">
        {/* 왼쪽 그룹 */}
        <button className="btn-outline" onClick={() => nav(-1)}>
          뒤로가기
        </button>

        {/* 오른쪽 그룹 */}
        <div className="flex gap-12">
          <button className="btn-glow" onClick={() => nav("/universe")}>
            우주 들어가기
          </button>
          <button className='btn-glow' onClick={() => nav("/mypage")}>
            마이페이지
          </button>
        </div>
      </div>

      {/* 🪐 자산 리스트 */}
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
                  onClick={() =>
                    handleBuy(
                      asset.type,
                      asset._id,
                      asset.name,
                      asset.price,
                      asset.imageUrl
                    )
                  }
                >
                  구매하기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ 4. 구매 패널 */}
      {showPurchase && selectedAsset && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
          <PurchasePanel
            key={selectedAsset.name}
            data={selectedAsset}
            onBack={() => setShowPurchase(false)}
            onBuy={(payload) => {
              setSelectedAsset(payload);
              setShowPurchase(false);
              setShowPayment(true);
            }}
          />
        </div>
      )}

      {/* ✅ 5. 결제 모달 (기존 Modal 활용) */}
      {showPayment && (
        <Modal
          title="💳 결제창구"
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
        >
          <p>자산명: {selectedAsset?.name}</p>
          <p>선택한 셀 개수: {selectedAsset?.selectedCells?.length}</p>
          <p>
            총 결제 금액:{" "}
            <span className="text-cyan-300 font-bold">
              {(selectedAsset?.selectedCells?.length || 1) *
                (selectedAsset?.price || 1000)}{" "}
              KRW
            </span>
          </p>

          <div className="flex flex-col gap-3 mt-5">
            <button
              className="btn-neo btn-neo--lg"
              onClick={() => {
                // 💳 Toss 결제 위젯 페이지로 이동
                const totalAmount =
                  (selectedAsset?.selectedCells?.length || 1) *
                  (selectedAsset?.price || 1000);

                // 쿼리스트링으로 금액, 이름 전달
                window.location.href = `/sandbox?orderName=${encodeURIComponent(
                  selectedAsset?.name
                )}&amount=${totalAmount}`;
              }}
            >
              Toss 결제창 열기
            </button>

            <button
              className="btn-neo btn-neo--lg"
              onClick={() => setShowPayment(false)}
            >
              닫기
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}
