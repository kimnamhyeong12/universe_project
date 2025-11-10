import { useEffect, useRef, useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

const generateRandomString = () => window.btoa(Math.random()).slice(0, 20);
const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

export function CheckoutPage() {
  const [ready, setReady] = useState(false);
  const [widgets, setWidgets] = useState(null);
  const [amount, setAmount] = useState({
    currency: "KRW",
    value: 0,
  });
  const [orderName, setOrderName] = useState("상품명");
  const paymentMethodWidgetRef = useRef(null);

  // ✅ (1) URL 파라미터 읽기
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const price = parseInt(params.get("amount") || "0", 10);
    const name = params.get("orderName") || "Celestia 자산 결제";

    setAmount({ currency: "KRW", value: price });
    setOrderName(name);
  }, []);

  // ✅ (2) Toss 위젯 로드
  useEffect(() => {
    async function fetchPaymentWidgets() {
      const tossPayments = await loadTossPayments(clientKey);
      const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
      setWidgets(widgets);
    }

    fetchPaymentWidgets();
  }, []);

  // ✅ (3) Toss 위젯 렌더링
  useEffect(() => {
    async function renderPaymentWidgets() {
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

    renderPaymentWidgets();
  }, [widgets, amount]);

  // ✅ (4) UI
  return (
    <div className="wrapper w-100">
      <div className="max-w-540 w-100">
        <h2 className="title text-center"  style={{ color: "#fff" }}>
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
                  orderName: orderName,
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
