import { useEffect, useRef, useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

const generateRandomString = () => window.btoa(Math.random()).slice(0, 20);
const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

export function CheckoutPage() {
  const [ready, setReady] = useState(false);
  const [widgets, setWidgets] = useState(null);
  const [amount, setAmount] = useState({ currency: "KRW", value: 0 });
  const [orderName, setOrderName] = useState("상품명");
  const paymentMethodWidgetRef = useRef(null);

  // ✅ (1) sessionId만 URL에서 읽기
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("sessionId");

    if (!sessionId) {
      alert("유효하지 않은 결제 세션입니다.");
      window.location.href = "/market";
      return;
    }

    // ✅ (2) 백엔드에서 sessionId로 결제 정보 불러오기
    async function fetchSessionData() {
      try {
        const res = await fetch(`http://localhost:5000/api/payments/session/${sessionId}`);
        const data = await res.json();

        if (!res.ok) {
          alert("결제 정보를 불러올 수 없습니다.");
          window.location.href = "/market";
          return;
        }

        // 서버에서 받은 금액/상품명 반영
        setOrderName(data.name || "Celestia 자산 결제");
        setAmount({ currency: "KRW", value: data.amount || 0 });
        setReady(true);
      } catch (err) {
        console.error("❌ 결제 세션 불러오기 실패:", err);
        alert("결제 정보를 불러오는 중 오류가 발생했습니다.");
        window.location.href = "/market";
      }
    }

    fetchSessionData();
  }, []);

  // ✅ (3) Toss 위젯 초기화
  useEffect(() => {
    async function initWidgets() {
      const tossPayments = await loadTossPayments(clientKey);
      const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
      setWidgets(widgets);
    }

    initWidgets();
  }, []);

  // ✅ (4) Toss 위젯 렌더링
  useEffect(() => {
    async function renderWidgets() {
      if (!widgets || amount.value === 0) return;

      await widgets.setAmount(amount);

      const [paymentMethodWidget] = await Promise.all([
        widgets.renderPaymentMethods({
          selector: "#payment-method",
          variantKey: "DEFAULT",
        }),
        widgets.renderAgreement({
          selector: "#agreement",
          variantKey: "AGREEMENT",
        }),
      ]);

      paymentMethodWidgetRef.current = paymentMethodWidget;
      setReady(true);
    }

    renderWidgets();
  }, [widgets, amount]);

  // ✅ (5) UI
  return (
    <div className="wrapper w-100">
      <div className="max-w-540 w-100">
        <h2 className="title text-center" style={{ color: "#fff" }}>
          💳 {orderName}
        </h2>
        <p className="text-center color-grey">
          결제 금액: {amount.value.toLocaleString()}원
        </p>

        <div id="payment-method" className="w-100 mt-4" />
        <div id="agreement" className="w-100 mt-4" />

        <div className="btn-wrapper w-100 mt-5">
          <button
            className="btn primary w-100"
            disabled={!ready}
            onClick={async () => {
              try {
                await widgets?.requestPayment({
                  orderId: generateRandomString(),
                  orderName,
                  customerName: "테스트 사용자",
                  successUrl: "http://localhost:5173/sandbox/success",
                  failUrl: "http://localhost:5173/sandbox/fail",
                });
              } catch (error) {
                console.error("❌ 결제 오류:", error);
              }
            }}
          >
            결제하기
          </button>
        </div>
      </div>
    </div>
  );
}
