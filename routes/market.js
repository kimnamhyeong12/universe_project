const express = require("express");
const Planet = require("../models/Planet");
const Star = require("../models/Star");
const Galaxy = require("../models/Galaxy");
const Blackhole = require("../models/Blackhole");
const { authMiddleware } = require("../utils/authMiddleware");

const router = express.Router();

/**
 * 🪐 1️⃣ 모든 구매 가능한 자산 조회 (행성 + 별 + 은하 + 블랙홀)
 * GET /api/market
 */
router.get("/", async (req, res) => {
  try {
    const [planets, stars, galaxies, blackholes] = await Promise.all([
      Planet.find({ isForSale: true }).select("name imageUrl price description"),
      Star.find({ isForSale: true }).select("name type description name imageUrl price"),
      // 밑에 은하계, 블랙홀 구매 할거면 .select("palnet, star 처럼 포맷하면 됨 지우지마.")
      // Galaxy.find({ isForSale: true }).select("name description size numberOfStars"),
      // Blackhole.find({ isForSale: true }).select("name description mass radius"),
    ]);

    res.json({
      planets,
      stars,
      galaxies,
      blackholes,
    });
  } catch (err) {
    console.error("❌ 우주 자산 조회 실패:", err);
    res.status(500).json({ error: "자산 불러오기 실패" });
  }
});

/**
 * 🌍 2️⃣ 특정 자산 상세보기
 * GET /api/market/:type/:id
 * ex) /api/market/Planet/6732f7e...
 */
router.get("/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  const models = { Planet, Star, Galaxy, Blackhole };

  try {
    const Model = models[type];
    if (!Model) return res.status(400).json({ error: "잘못된 자산 타입" });

    const asset = await Model.findById(id).populate("owner", "username email");
    if (!asset) return res.status(404).json({ error: "자산을 찾을 수 없습니다" });

    res.json(asset);
  } catch (err) {
    console.error("❌ 자산 상세조회 실패:", err);
    res.status(500).json({ error: "자산 상세조회 실패" });
  }
});

/**
 * 💰 3️⃣ 구매 요청 (결제 전송)
 * POST /api/market/buy
 * body: { assetType, assetId }
 */
router.post("/buy", authMiddleware, async (req, res) => {
  const { assetType, assetId } = req.body;
  try {
    const models = { Planet, Star, Galaxy, Blackhole };
    const Model = models[assetType];
    if (!Model) return res.status(400).json({ error: "잘못된 자산 타입" });

    const asset = await Model.findById(assetId);
    if (!asset || !asset.isForSale)
      return res.status(400).json({ error: "이미 판매 완료된 자산입니다" });

    // 🎯 결제창 이동용 데이터 반환
    res.json({
      message: "✅ 구매 준비 완료",
      asset: {
        id: asset._id,
        name: asset.name,
        price: asset.price || 0,
        description: asset.description,
        imageUrl: asset.imageUrl || null,
      },
    });
  } catch (err) {
    console.error("❌ 구매 준비 실패:", err);
    res.status(500).json({ error: "구매 처리 실패" });
  }
});

module.exports = router;
