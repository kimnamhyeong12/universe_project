// 📁 routes/planet.js
const express = require("express");
const router = express.Router();
const Planet = require("../models/Planet");

// ✅ 모든 행성 조회 (선택적 필터: star=ID)
router.get("/", async (req, res) => {
  try {
    const { star } = req.query;

    const filter = {};
    if (star) {
      filter.star = star; // /api/planets?star=...
    }

    const planets = await Planet.find(filter)
      .populate("star owner")
      .sort({ createdAt: -1 });

    res.json(planets);
  } catch (err) {
    console.error("❌ Planet GET 오류:", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

module.exports = router;
