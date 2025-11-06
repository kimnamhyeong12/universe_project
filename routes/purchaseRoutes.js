const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const mongoose = require("mongoose");

// ✅ 구매 데이터 모델 정의 (별도 models/Purchase.js 파일로 분리해도 됨)
const purchaseSchema = new mongoose.Schema({
  planetName: { type: String, required: true },
  cellId: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});
const Purchase = mongoose.model("Purchase", purchaseSchema);

// ✅ 구매 정보 등록
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planetName, cells } = req.body;

    if (!planetName || !Array.isArray(cells) || cells.length === 0) {
      return res.status(400).json({ message: "잘못된 요청" });
    }

    const purchases = await Promise.all(
      cells.map((cellId) =>
        Purchase.create({
          planetName,
          cellId,
          owner: userId,
        })
      )
    );

    res.json({ message: "✅ 구매 완료", data: purchases });
  } catch (err) {
    console.error("❌ 구매 오류:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// ✅ 특정 행성의 구매 정보 조회
router.get("/:planetName", async (req, res) => {
  try {
    const { planetName } = req.params;
    const purchases = await Purchase.find({ planetName });
    res.json(purchases);
  } catch (err) {
    console.error("❌ 구매 내역 조회 오류:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// ✅ 로그인한 사용자의 구매 내역 조회 (마이페이지용)
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // 로그인한 유저가 자기 데이터만 조회 가능하도록 보호
    if (req.user.id !== userId) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    const purchases = await Purchase.find({ owner: userId });
    res.json(purchases);
  } catch (err) {
    console.error("❌ 사용자 구매 내역 조회 오류:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

module.exports = router;
