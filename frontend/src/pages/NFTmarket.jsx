// ✅ src/pages/NFTmarket.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Market.css";
import Modal from "../components/Modal";
import AppHeader from "../components/AppHeader";

export default function NFTmarket() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pointBalance, setPointBalance] = useState(0);

  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buying, setBuying] = useState(false);

  // 🔹 현재 로그인 유저 ID
  const userId = user?.id || null;

  // 🔹 포인트 불러오기
  useEffect(() => {
    async function loadBalance() {
      const token =
        localStorage.getItem("celestia_token") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("token");
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

  // 🔹 NFT 마켓 데이터 불러오기
  useEffect(() => {
    async function fetchNFTs() {
      try {
        const res = await fetch("http://localhost:5000/api/nft/market");
        const data = await res.json();

        // 응답 형태 유연하게 처리: 배열 / { nfts } / { items }
        let list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (Array.isArray(data.nfts)) {
          list = data.nfts;
        } else if (Array.isArray(data.items)) {
          list = data.items;
        } else {
          list = [];
        }

        setNfts(list);
      } catch (err) {
        console.error("❌ NFT 마켓 데이터 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, []);

  const handleOpenBuy = (nft) => {
    const token =
      localStorage.getItem("celestia_token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("token");

    // 🔹 내 NFT면 구매 불가
    if (user && String(nft.owner) === String(user.id)) {
      alert("자신이 소유한 NFT는 구매할 수 없습니다.");
      return;
    }

    if (!token) {
      alert("NFT를 구매하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    setSelectedNFT(nft);
    setShowBuyModal(true);
  };

  const handleBuy = async () => {
    if (!selectedNFT) return;

    const token =
      localStorage.getItem("celestia_token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("token");

    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    setBuying(true);
    try {
      const res = await fetch("http://localhost:5000/api/nft/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nftId: selectedNFT._id }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        alert(data.message || "NFT 구매에 실패했습니다.");
        return;
      }

      alert("🎉 NFT 구매 완료!");

      // 포인트 잔액 갱신
      if (typeof data.newBalance === "number") {
        setPointBalance(data.newBalance);
      } else if (selectedNFT.price) {
        setPointBalance((prev) => prev - (selectedNFT.price || 0));
      }

      // 방금 산 NFT는 마켓 목록에서 제거
      setNfts((prev) => prev.filter((n) => n._id !== selectedNFT._id));

      setShowBuyModal(false);
      setSelectedNFT(null);
    } catch (err) {
      console.error("❌ NFT 구매 요청 오류:", err);
      alert("서버 오류로 구매에 실패했습니다.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="market-page">
      <AppHeader activeLink="nftmarket" />

      <div className="market-header">
        <h1 className="market-title">🪐 NFT Market</h1>

        <div className="point-display">
          💠 내 포인트:
          <span className="text-cyan-300 font-bold">
            {" "}
            {pointBalance.toLocaleString()} P
          </span>
        </div>
      </div>

      {/* NFT 리스트 */}
      {loading ? (
        <p className="loading">Loading NFT assets...</p>
      ) : nfts.length === 0 ? (
        <p className="no-assets">판매 중인 NFT가 없습니다.</p>
      ) : (
        <div className="market-grid">
          {nfts.map((nft) => {
            const isMyNft =
              userId && String(nft.owner) === String(userId);

            return (
              <div key={nft._id} className="item-card">
                <img
                  src={nft.imageDataUrl || "/default_space.jpg"}
                  alt={nft.title || `${nft.planetName} ${nft.cellId}`}
                  className="item-image"
                />
                <div className="item-info">
                  <div className="item-type">
                    {nft.planetName
                      ? `${nft.planetName} ${nft.cellId || ""}`
                      : "Pixel Cell"}
                  </div>

                  <div className="item-name">
                    {nft.title || nft.name || "NFT 자산"}
                  </div>

                  <div className="text-xs text-cyan-200/80 mb-1">
                    소유주: {nft.ownerName || "알 수 없음"}
                  </div>

                  {typeof nft.price === "number" && (
                    <div className="item-price">
                      {nft.price.toLocaleString()} P
                    </div>
                  )}

                  {/* 🔹 내 NFT면 구매 버튼 대신 뱃지 표시 */}
                  {isMyNft ? (
                    <div className="my-nft-badge">
                      내 NFT
                    </div>
                  ) : (
                    <button
                      className="buy-btn"
                      onClick={() => handleOpenBuy(nft)}
                    >
                      NFT 구매하기
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NFT 구매 모달 */}
      {showBuyModal && selectedNFT && (
        <Modal
          title="🪐 NFT 구매"
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <img
                src={selectedNFT.imageDataUrl || "/default_space.jpg"}
                alt={selectedNFT.title || "NFT"}
                style={{
                  width: "160px",
                  height: "160px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  border: "1px solid rgba(0,255,255,0.3)",
                }}
              />
              <div className="flex-1">
                <div className="text-sm text-cyan-200/70 mb-1">
                  {selectedNFT.planetName && selectedNFT.cellId
                    ? `${selectedNFT.planetName} — ${selectedNFT.cellId} 구역`
                    : "NFT 자산"}
                </div>
                <div className="text-xl font-bold text-white mb-2">
                  {selectedNFT.title || selectedNFT.name || "NFT"}
                </div>
                <div className="text-sm text-cyan-200/80 mb-1">
                  현재 소유주: {selectedNFT.ownerName || "알 수 없음"}
                </div>
                <div className="text-lg font-semibold text-cyan-300">
                  가격:{" "}
                  {typeof selectedNFT.price === "number"
                    ? `${selectedNFT.price.toLocaleString()} P`
                    : "가격 정보 없음"}
                </div>
              </div>
            </div>

            {/* 포인트 변동 박스 */}
            <div className="w-full mb-2 p-3 rounded-lg bg-black/40 border border-cyan-500/20 flex justify-between gap-4">
              <div className="flex-1">
                <div className="text-xs text-cyan-200/70">내 보유 포인트</div>
                <div className="text-lg font-bold text-cyan-300">
                  {pointBalance.toLocaleString()} P
                </div>
              </div>

              <div className="flex-1 text-center">
                <div className="text-xs text-cyan-200/70">
                  이번 NFT 구매 차감
                </div>
                <div className="text-lg font-bold text-yellow-300">
                  - {(selectedNFT.price || 0).toLocaleString()} P
                </div>
              </div>

              <div className="flex-1 text-right">
                <div className="text-xs text-cyan-200/70">
                  구매 후 예상 잔액
                </div>
                <div
                  className="text-lg font-bold"
                  style={{
                    color:
                      pointBalance - (selectedNFT.price || 0) < 0
                        ? "#FF4E78"
                        : "#7CFFB2",
                  }}
                >
                  {(pointBalance - (selectedNFT.price || 0)).toLocaleString()} P
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                className="btn-neo btn-neo--lg"
                disabled={
                  buying || pointBalance < (selectedNFT.price || 0)
                }
                style={{
                  opacity:
                    buying || pointBalance < (selectedNFT.price || 0)
                      ? 0.5
                      : 1,
                  cursor:
                    buying || pointBalance < (selectedNFT.price || 0)
                      ? "not-allowed"
                      : "pointer",
                }}
                onClick={handleBuy}
              >
                {buying ? "구매 처리 중..." : "NFT 구매하기"}
              </button>
              <button
                className="btn-neo btn-neo--lg"
                onClick={() => setShowBuyModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
