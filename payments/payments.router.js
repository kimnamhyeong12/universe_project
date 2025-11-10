const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const verifyToken = require("../middleware/verifyToken");
const { confirmPayment } = require("./payments.service");
const TempPayment = require("../models/TempPayment"); // ✅ 세션 저장용 모델 (아래 따로 정의)

// ✅ [1] 결제 세션 생성 (POST /api/payments/start)
router.post("/start", verifyToken, async (req, res) => {
  try {
    const { name, assetId, amount } = req.body;
    if (!name || !assetId || !amount) {
      return res.status(400).json({ message: "필수 정보 누락" });
    }

    // sessionId 생성
    const sessionId = crypto.randomBytes(16).toString("hex");

    // 세션 정보 DB 저장
    await TempPayment.create({
      sessionId,
      userId: req.user.id,
      name,
      assetId,
      amount,
      createdAt: new Date(),
    });

    console.log(`✅ 결제 세션 생성: ${sessionId}`);
    res.json({ sessionId });
  } catch (err) {
    console.error("❌ 결제 세션 생성 오류:", err);
    res.status(500).json({ message: "결제 세션 생성 실패", error: err.message });
  }
});

// ✅ [2] 세션 조회 (GET /api/payments/session/:id)
router.get("/session/:id", async (req, res) => {
  try {
    const session = await TempPayment.findOne({ sessionId: req.params.id });
    if (!session) {
      return res.status(404).json({ message: "세션을 찾을 수 없습니다." });
    }

    res.json({
      name: session.name,
      amount: session.amount,
      assetId: session.assetId,
    });
  } catch (err) {
    console.error("❌ 세션 조회 오류:", err);
    res.status(500).json({ message: "세션 조회 실패", error: err.message });
  }
});

// ✅ [3] 결제 승인 요청 (기존 그대로 유지)
router.post("/confirm", async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;

    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }

    const result = await confirmPayment({ paymentKey, orderId, amount });
    res.json({ message: "✅ 결제 승인 성공", data: result });
  } catch (err) {
    console.error("❌ 결제 승인 실패:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  }
});

module.exports = router;
