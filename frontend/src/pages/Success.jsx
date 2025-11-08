import { useState } from "react";

export function SuccessPage() {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState(null);

  const searchParams = new URLSearchParams(window.location.search);
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  async function confirmPayment() {
    try {
      // 1️⃣ 결제 승인
      const response = await fetch("http://localhost:5000/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "결제 승인 실패");

      // 2️⃣ 로컬 저장 데이터 불러오기
      const lastPlanet = localStorage.getItem("lastPlanet");
      const lastCells = JSON.parse(localStorage.getItem("lastCells") || "[]");
      const token =
        localStorage.getItem("jwt") ||
        localStorage.getItem("token") ||
        localStorage.getItem("celestia_token");

      // 3️⃣ 구매 확정 + 인증서 자동 발급
      const purchasePayload = {
        orderId,
        paymentKey,
        amount,
        itemName: data.orderName || "Celestia Asset",
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
      if (!saveRes.ok) throw new Error(saveData.message || "구매 정보 저장 실패");

      setIsConfirmed(true);

      // 4️⃣ 인증서 자동 다운로드
      const purchaseIds = saveData.purchaseIds || [];
      for (const id of purchaseIds) {
        const certRes = await fetch("http://localhost:5000/api/certificates/issue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ purchaseId: id }),
        });

        if (!certRes.ok) {
          const errText = await certRes.text();
          console.error("❌ 인증서 발급 실패:", errText);
          continue;
        }

        // ✅ PDF blob 처리
        const blob = await certRes.blob();
        const cd = certRes.headers.get("Content-Disposition") || "";
        const match = cd.match(/filename="(.+?)"/i);
        const filename = match?.[1] || `certificate-${Date.now()}.pdf`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("❌ 오류:", err);
      setError(err);
    }
  }

  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      {isConfirmed ? (
        <div>
          <img
            src="https://static.toss.im/illusts/check-blue-spot-ending-frame.png"
            width="120"
            height="120"
            alt="결제완료"
          />
          <h2>결제가 완료되었습니다 🎉</h2>
          <p>인증서가 자동으로 다운로드되었습니다.</p>
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
          <h2>결제 요청까지 완료되었습니다</h2>
          <p>아래 버튼을 눌러 결제를 승인하고 인증서를 발급받으세요.</p>
          <div style={{ marginTop: "24px" }}>
            <button className="btn primary w-100" onClick={confirmPayment}>
              결제 승인 + 인증서 다운로드
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
