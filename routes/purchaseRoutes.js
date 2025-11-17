// routes/purchase.route.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { v4: uuidv4 } = require("uuid");

const Purchase = require("../models/Purchase");
const Point = require("../models/Point");
const PointTransaction = require("../models/PointTransaction");

const Planet = require("../models/Planet");

// ==========================================================
// 🔥 1) 포인트 결제 기반 구매 처리
// URL: POST /api/purchase/with-point
// ==========================================================
router.post("/with-point", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;

    const { planetName, cells } = req.body;

    if (!planetName || !Array.isArray(cells) || cells.length === 0) {
      return res.status(400).json({ message: "행성 또는 셀이 유효하지 않습니다." });
    }

    // 🔥🔥🔥 행성 가격을 DB에서 가져온다!
    const planet = await Planet.findOne({ name: planetName });
    if (!planet) {
      return res.status(404).json({ message: "행성을 찾을 수 없습니다." });
    }

    const pricePerCell = planet.price; // 👈 여기서 실제 가격 가져온다!!!
    const totalCost = pricePerCell * cells.length; // 👈 가격 × 셀 수

    // ⭐ 유저 포인트 로드
    let pointDoc = await Point.findOne({ user: userId });
    if (!pointDoc) return res.status(400).json({ message: "포인트 계정이 없습니다." });

    if (pointDoc.balance < totalCost) {
      return res.status(400).json({
        message: "포인트가 부족합니다.",
        need: totalCost,
        have: pointDoc.balance,
      });
    }

    // ⭐ 이미 구매된 셀 있는지 확인
    const existing = await Purchase.find({
      planetName,
      cellId: { $in: cells },
    });

    if (existing.length > 0) {
      return res.status(400).json({
        message: "이미 구매된 셀이 포함되어 있습니다.",
        occupiedCells: existing.map((e) => e.cellId),
      });
    }

    // ⭐ 포인트 차감
    pointDoc.balance -= totalCost;
    await pointDoc.save();

    // ⭐ 포인트 거래내역 기록
    await PointTransaction.create({
      user: userId,
      amount: -totalCost,
      type: "spend",
      description: `${planetName} ${cells.length}개 셀 구매`,
    });

    // ⭐ 구매 기록 저장
    const purchaseRecords = await Promise.all(
      cells.map((cellId) =>
        Purchase.create({
          planetName,
          cellId,
          owner: userId,
          buyer: username,
          amount: pricePerCell, // 셀당 가격 저장
          transactionDate: new Date(),
          editToken: uuidv4(),
        })
      )
    );

    // ⭐ 인증서 자동 발급
    const axios = require("axios");
    const tokenHeader = req.headers.authorization;

    for (const record of purchaseRecords) {
      try {
        await axios.post(
          "http://localhost:5000/api/certificates/issue",
          { purchaseId: record._id },
          { headers: { Authorization: tokenHeader } }
        );
      } catch (err) {
        console.error("❌ 인증서 발급 실패:", err?.response?.data || err.message);
      }
    }

    res.json({
      message: "🎉 포인트 결제 성공 + 구매 완료 + 인증서 발급",
      purchaseIds: purchaseRecords.map((r) => r._id),
    });
  } catch (err) {
    console.error("❌ 포인트 구매 오류:", err);
    res.status(500).json({ message: "서버 오류 발생", error: err.message });
  }
});

// ==========================================================
// 🔎 2) 특정 행성 구매 내역 조회
// ==========================================================
router.get("/:planetName", async (req, res) => {
  try {
    const { planetName } = req.params;
    const list = await Purchase.find({ planetName });
    res.json(list);
  } catch (err) {
    console.error("❌ 구매 내역 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ==========================================================
// 👤 3) 로그인 유저 구매 내역 조회
// ==========================================================
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId)
      return res.status(403).json({ message: "권한 없음" });

    const list = await Purchase.find({ owner: userId });
    res.json(list);
  } catch (err) {
    console.error("❌ 사용자 구매 내역 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
