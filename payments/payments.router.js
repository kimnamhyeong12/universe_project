const express = require("express");
const router = express.Router();
const { confirmPayment } = require("./payments.service");

// ✅ 결제 승인 요청
router.post("/confirm", async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;

    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }

    // Toss 결제 승인 API 호출
    const result = await confirmPayment({ paymentKey, orderId, amount });

    res.json({
      message: "✅ 결제 승인 성공",
      data: result,
    });
  } catch (err) {
    console.error("❌ 결제 승인 실패:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  }
});

module.exports = router;
