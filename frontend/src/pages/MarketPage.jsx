// ✅ src/pages/MarketPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Market.css";
import PurchasePanel from "../components/PurchasePanel";
import Modal from "../components/Modal";
import AppHeader from "../components/AppHeader";

export default function MarketPage() {
  const nav = useNavigate();
  const location = useLocation();

  // ⭐ 토큰은 전역 user가 아니라 localStorage로 직접 가져와야 함
  const token = localStorage.getItem("celestia_token");

  // 자산 목록 및 상태
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // 패널 / 모달 상태
  const [showPurchase, setShowPurchase] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // ⭐ 유저 포인트 불러오기
  const [pointBalance, setPointBalance] = useState(0);

  // Universe에서 asset 전달 시 자동 열기
  const { asset } = location.state || {};

  useEffect(() => {
    if (asset) {
      setSelectedAsset(asset);
      setShowPurchase(true);
    }
  }, [asset]);

  // ⭐ 1) 서버에서 마켓 자산 불러오기
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

  // ⭐ 2) 포인트 불러오기
  useEffect(() => {
    async function loadBalance() {
      const token = localStorage.getItem("celestia_token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:5000/api/points/balance", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setPointBalance(data.balance || 0);
      } catch (err) {
        console.error("❌ 포인트 불러오기 실패:", err);
      }
    }

    loadBalance();
  }, []);

  // 구매 버튼 클릭 (패널 열기)
  const handleBuy = (type, id, name, price, imageUrl) => {
    const token = localStorage.getItem("celestia_token");

    if (!token) {
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
      <AppHeader activeLink="MarketPage" />

      <div className="market-header">
        <h1 className="market-title">🌌 Universe Market</h1>

        <div className="point-display">
          💠 내 포인트:
          <span className="text-cyan-300 font-bold"> {pointBalance.toLocaleString()} P</span>
        </div>
      </div>

      {/* 자산 리스트 */}
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
                    {asset.price.toLocaleString()} P
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

      {/* ⭐ 구매 패널 */}
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

      {/* ⭐ 포인트 결제 모달 */}
      {showPayment && (
        <Modal
          title="💳 포인트 결제"
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
              P
            </span>
          </p>

          <div className="flex flex-col gap-3 mt-5">
            <button
              className="btn-neo btn-neo--lg"
              onClick={async () => {
                const token = localStorage.getItem("celestia_token");

                try {
                  const res = await fetch(
                    "http://localhost:5000/api/purchase/with-point",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        planetName: selectedAsset.name,
                        cells: selectedAsset.selectedCells,
                      }),
                    }
                  );

                  const data = await res.json();
                  if (!res.ok) {
                    alert("포인트 결제 실패: " + data.message);
                    return;
                  }

                  alert("🎉 결제 성공! 인증서가 발급됩니다.");

                  // 다운로드 로직
                  const purchaseIds = data.purchaseIds;

                  for (const pid of purchaseIds) {
                    try {
                      const pdfRes = await fetch(
                        "http://localhost:5000/api/certificates/issue",
                        {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ purchaseId: pid }),
                        }
                      );

                      const blob = await pdfRes.blob();
                      const url = window.URL.createObjectURL(blob);

                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `certificate-${pid}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();

                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error("❌ PDF 다운로드 오류:", err);
                      alert("일부 인증서 다운로드에 실패했습니다.");
                    }
                  }

                  setShowPayment(false);
                } catch (err) {
                  console.error("❌ 결제 오류:", err);
                }
              }}
            >
              포인트로 결제하기
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
