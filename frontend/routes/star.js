// 📁 routes/star.js
const express = require("express");
const router = express.Router();
const Star = require("../models/Star");

// ✅ 모든 항성 조회 (선택적 필터: galaxy=ID)
router.get("/", async (req, res) => {
  try {
    const { galaxy } = req.query;

    const filter = {};
    if (galaxy) {
      filter.galaxy = galaxy; // /api/stars?galaxy=...
    }

    const stars = await Star.find(filter)
      .populate("galaxy owner")
      .sort({ createdAt: -1 });

    res.json(stars);
  } catch (err) {
    console.error("❌ Star GET 오류:", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

module.exports = router;
