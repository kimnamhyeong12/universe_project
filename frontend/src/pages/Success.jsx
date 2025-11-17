import { useEffect, useState, useRef } from "react";

export function SuccessPage() {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState(null);

  
  const confirmedOnce = useRef(false);   // ⭐ 중복 방지 핵심

  // URL Params
  const searchParams = new URLSearchParams(window.location.search);
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const sessionId = searchParams.get("sessionId");
  const type = searchParams.get("type"); // ⭐ point or market(기본)

  const token =
    localStorage.getItem("jwt") ||
    localStorage.getItem("token") ||
    localStorage.getItem("celestia_token");

  // ===================================================================
  // 🔥 1) POINT 충전 결제 성공 처리
  // ===================================================================
  useEffect(() => {
    if (type !== "point") return;
    if (confirmedOnce.current) return;   // ⭐ 두 번 실행 방지
    confirmedOnce.current = true;

    async function confirmPointCharge() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/payments/confirm-point`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentKey,
              orderId,
              amount,
              sessionId,
            }),
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setIsConfirmed(true);
      } catch (err) {
        setError(err);
      }
    }

    confirmPointCharge();
  }, [type, paymentKey, orderId, amount, sessionId]);

  // ===================================================================
  // 🖥 화면 렌더링
  // ===================================================================

  // ⭐ POINT 충전 성공 렌더링
  if (type === "point") {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        {isConfirmed ? (
          <>
            <h2>🎉 포인트 충전이 완료되었습니다!</h2>
            <p>마이페이지에서 잔액을 확인하세요.</p>

            <div style={{ marginTop: "30px" }}>
              <a href="/mypage" className="btn primary">
                마이페이지로 이동
              </a>
            </div>
          </>
        ) : error ? (
          <p style={{ color: "#f66" }}>
            ❌ {error.message || "포인트 충전 처리 중 오류 발생"}
          </p>
        ) : (
          <div>
            <img
              src="https://static.toss.im/lotties/loading-spot-apng.png"
              width="120"
              height="120"
              alt="로딩"
            />
            <h2>포인트 충전 처리 중...</h2>
          </div>
        )}
      </div>
    );
  }
}
