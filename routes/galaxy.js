// 📁 routes/galaxy.js
const express = require("express");
const router = express.Router();
const Galaxy = require("../models/Galaxy");

// ✅ 모든 은하 조회
router.get("/", async (req, res) => {
  try {
    const galaxies = await Galaxy.find()
      .populate("owner") // 사용자 정보도 포함
      .sort({ createdAt: -1 }); // 최신순 정렬

    res.json(galaxies);
  } catch (err) {
    console.error("❌ Galaxy GET 오류:", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

module.exports = router;
