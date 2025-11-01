const express = require("express");
const Planet = require("../models/Planet");
const { authMiddleware } = require("../utils/authMiddleware");

const router = express.Router();

// 모든 행성 조회
router.get("/", async (req, res) => {
  const planets = await Planet.find().populate("owner", "username");
  res.json(planets);
});

// 행성 등록
router.post("/create", authMiddleware, async (req, res) => {
  const { name, description, imageUrl, price } = req.body;
  const planet = new Planet({
    name,
    description,
    imageUrl,
    price,
    isForSale: true,
    owner: req.user.id,
  });
  await planet.save();
  res.status(201).json({ message: "✅ 행성 등록 완료" });
});

module.exports = router;
