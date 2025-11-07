const express = require("express");
const Universe = require("../models/Universe");
const { authMiddleware } = require("../utils/authMiddleware");

const router = express.Router();

// 모든 우주 조회
router.get("/", async (req, res) => {
  try {
    const universes = await Universe.find().populate("creator", "username");
    res.json(universes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ 우주 조회 실패" });
  }
});

// 우주 등록
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { name, description, age, galaxiesCount } = req.body;
    const universe = new Universe({
      name,
      description,
      age,
      galaxiesCount,
      creator: req.user.id,
      isForSale: true,
    });
    await universe.save();
    res.status(201).json({ message: "🌌 우주 등록 완료" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ 우주 등록 실패" });
  }
});

module.exports = router;
