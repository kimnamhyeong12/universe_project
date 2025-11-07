import { useState } from "react";

export function SuccessPage() {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState(null);

  // ✅ URL 파라미터에서 결제 정보 읽기
  const searchParams = new URLSearchParams(window.location.search);
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  // ✅ 결제 승인 + DB 저장
  async function confirmPayment() {
    try {
      // 1️⃣ 서버로 결제 승인 요청 (토스 결제 승인)
      const response = await fetch("http://localhost:5000/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ 결제 승인 실패:", data);
        setError(data);
        return;
      }

      console.log("✅ 결제 승인 성공:", data);

      // 2️⃣ localStorage에서 구매한 셀 정보 불러오기
      const lastPlanet = localStorage.getItem("lastPlanet");
      const lastCells = JSON.parse(localStorage.getItem("lastCells") || "[]");

      if (!lastPlanet || lastCells.length === 0) {
        console.warn("⚠️ 저장할 구매 데이터 없음:", { lastPlanet, lastCells });
      }

      // 3️⃣ JWT 토큰 가져오기
      const token =
        localStorage.getItem("jwt") ||
        localStorage.getItem("token") ||
        localStorage.getItem("celestia_token");

      // 4️⃣ MongoDB에 구매 내역 저장 요청
      const purchasePayload = {
        orderId,
        paymentKey,
        amount,
        itemName: data.orderName || "Celestia 자산",
        buyer: data.customerName || "테스트 사용자",
        planetName: lastPlanet,
        cells: lastCells,
      };

      const saveRes = await fetch("http://localhost:5000/api/purchase/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(purchasePayload),
      });

      const saveData = await saveRes.json();

      if (saveRes.ok) {
        console.log("💾 구매 정보 DB 반영 완료:", saveData);
        setIsConfirmed(true);
      } else {
        console.error("❌ DB 저장 실패:", saveData);
        setError(saveData);
      }
    } catch (err) {
      console.error("🚨 네트워크 오류:", err);
      setError(err);
    }
  }

  // ✅ 화면 렌더링
  return (
    <div className="wrapper w-100" style={{ textAlign: "center", padding: "40px" }}>
      {isConfirmed ? (
        <div>
          <img
            src="https://static.toss.im/illusts/check-blue-spot-ending-frame.png"
            width="120"
            height="120"
            alt="결제완료"
          />
          <h2 className="title">결제를 완료했어요 🎉</h2>

          <div className="response-section w-100" style={{ marginTop: "20px" }}>
            <p>💰 결제 금액: {amount}원</p>
            <p>🧾 주문번호: {orderId}</p>
            <p>🔑 Payment Key: {paymentKey}</p>
          </div>

          <div style={{ marginTop: "30px" }}>
            <a href="http://localhost:5173/market" className="btn primary">
              마켓으로 돌아가기
            </a>
          </div>
        </div>
      ) : (
        <div>
          <img
            src="https://static.toss.im/lotties/loading-spot-apng.png"
            width="120"
            height="120"
            alt="결제중"
          />
          <h2 className="title text-center">결제 요청까지 성공했어요</h2>
          <p className="text-center color-grey">
            아래 버튼을 눌러 결제를 승인하고, 구매내역을 저장하세요.
          </p>

          <div style={{ marginTop: "24px" }}>
            <button className="btn primary w-100" onClick={confirmPayment}>
              결제 승인 + 구매 저장
            </button>
          </div>

          {error && (
            <p style={{ color: "#f66", marginTop: "20px" }}>
              ❌ {error.message || "결제 승인 중 오류가 발생했습니다."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
