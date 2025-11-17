import { useEffect, useRef, useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { useSearchParams } from "react-router-dom";

const generateRandomString = () => window.btoa(Math.random()).slice(0, 20);
const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

export function CheckoutPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("sessionId");
  const type = params.get("type"); // point or market
  const [ready, setReady] = useState(false);
  const [widgets, setWidgets] = useState(null);
  const [amount, setAmount] = useState({ currency: "KRW", value: 0 });
  const [orderName, setOrderName] = useState("상품명");
  const paymentMethodWidgetRef = useRef(null);

  // ✅ (1) 결제 세션 로딩
  useEffect(() => {
    if (!sessionId || !type) {
      alert("유효하지 않은 결제 URL입니다.");
      window.location.href = "/";
      return;
    }

    async function fetchSessionData() {
      try {
        const url =
          type === "point"
            ? `http://localhost:5000/api/payments/point-session/${sessionId}`
            : `http://localhost:5000/api/payments/session/${sessionId}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) throw new Error();

        setOrderName(type === "point" ? `${data.points.toLocaleString()}P 충전` : data.name);
        setAmount({ currency: "KRW", value: data.amount });
        setReady(true);
      } catch (err) {
        alert("결제 정보를 불러올 수 없습니다.");
        window.location.href = "/";
      }
    }

    fetchSessionData();
  }, [sessionId, type]);

  // ✅ (2) Toss 위젯 초기화
  useEffect(() => {
    async function initWidgets() {
      const tossPayments = await loadTossPayments(clientKey);
      const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
      setWidgets(widgets);
    }

    initWidgets();
  }, []);

  // ✅ (3) Toss 위젯 렌더링
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

  // ✅ (4) UI 렌더링
  return (
    <div className="wrapper w-100 bg-black text-white min-h-screen flex justify-center items-center">
      <div className="max-w-540 w-full p-6 bg-[#111827] rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4">💳 {orderName}</h2>
        <p className="text-center text-gray-300 mb-6">
          결제 금액: {amount.value.toLocaleString()}원
        </p>

        <div id="payment-method" className="w-full mb-6" />
        <div id="agreement" className="w-full mb-6" />

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-md font-semibold"
          disabled={!ready}
          onClick={async () => {
            try {
              await widgets?.requestPayment({
                orderId: generateRandomString(),
                orderName,
                customerName: "테스트 사용자",
                successUrl: `http://localhost:5173/sandbox/success?sessionId=${sessionId}&type=${type}`,
                failUrl: `http://localhost:5173/sandbox/fail?sessionId=${sessionId}&type=${type}`,
              });
            } catch (error) {
              console.error("❌ 결제 요청 오류:", error);
              alert("결제 요청 중 문제가 발생했습니다.");
            }
          }}
        >
          결제하기
        </button>
      </div>
    </div>
  );
}
