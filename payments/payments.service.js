// const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config();

// ✅ 환경변수에서 시크릿키 불러오기
const secretKey = process.env.TOSS_SECRET_KEY;

// ✅ Toss 결제 승인 API
async function confirmPayment({ paymentKey, orderId, amount }) {
  const encryptedSecretKey =
    "Basic " + Buffer.from(secretKey + ":").toString("base64");

  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: encryptedSecretKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Toss 승인 실패:", data);
    throw new Error(data.message || "결제 승인 실패");
  }

  return data;
}

module.exports = { confirmPayment };
