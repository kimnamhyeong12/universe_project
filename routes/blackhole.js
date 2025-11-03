// 📁 routes/blackhole.js
const express = require("express");
const router = express.Router();
const Blackhole = require("../models/Blackhole");

// ✅ 블랙홀 전체 조회 (GET /api/blackholes)
router.get("/", async (req, res) => {
  try {
    const blackholes = await Blackhole.find()
      .populate("owner") // 소유자 정보 포함
      .sort({ createdAt: -1 }); // 최신순 정렬

    res.json(blackholes);
  } catch (err) {
    console.error("❌ Blackhole GET 오류:", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

module.exports = router;
