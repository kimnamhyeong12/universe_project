// routes/pointsRoutes.js
const express = require("express");
const router = express.Router();
const Point = require("../models/Point");
const PointTransaction = require("../models/PointTransaction");
const TempPointPayment = require("../models/TempPointPayment");
const verifyToken = require("../middleware/verifyToken");
const { v4: uuidv4 } = require("uuid");

// ======================================
// 🔵 [1] 포인트 잔액 조회
// GET /api/points/balance
// ======================================
router.get("/balance", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    let point = await Point.findOne({ user: userId });

    // ⭐ 유저의 포인트 문서가 없으면 자동 생성
    if (!point) {
      point = await Point.create({
        user: userId,
        balance: 0,
      });
    }

    res.json({ balance: point.balance });
  } catch (err) {
    console.error("포인트 잔액 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


// ======================================
// 🧾 [2] 포인트 거래내역 조회
// GET /api/points/transactions
// ======================================
router.get("/transactions", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await PointTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(transactions);
  } catch (err) {
    console.error("포인트 거래내역 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ======================================
// 💸 [3] Toss 결제용 포인트 세션 생성
// POST /api/points/start
// ======================================
router.post("/start", verifyToken, async (req, res) => {
  try {
    const { amount, points } = req.body;

    if (!amount || !points) {
      return res.status(400).json({ message: "금액과 포인트가 필요합니다." });
    }

    const sessionId = uuidv4();

    await TempPointPayment.create({
      userId: req.user.id,   // TempPointPayment는 userId 필드 사용
      amount,
      points,
      sessionId,
      status: "pending",
    });

    res.json({
      message: "포인트 결제 세션 생성 완료",
      sessionId,
      redirectUrl: `http://localhost:5173/sandbox?sessionId=${sessionId}&type=point`,
    });
  } catch (err) {
    console.error("포인트 결제 세션 생성 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ======================================
// 🔥 [4] 서버 내부용 강제 포인트 충전 (Toss 사용 안함)
// POST /api/points/charge
// ======================================
router.post("/charge", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "유효한 포인트 금액이 아닙니다." });
    }

    let point = await Point.findOne({ user: userId });

    if (!point) {
      point = await Point.create({
        user: userId,
        balance: amount,
      });
    } else {
      point.balance += amount;
      await point.save();
    }

    await PointTransaction.create({
      user: userId,
      amount,
      type: "charge",
      description: "포인트 충전 (관리자/내부)",
    });

    res.json({ message: "포인트 충전 완료", balance: point.balance });
  } catch (err) {
    console.error("포인트 충전 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
