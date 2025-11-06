// backend/routes/pixelRoutes.js
const express = require("express");
const router = express.Router();
const Pixel = require("../models/Pixel");
const verifyToken = require("../middleware/verifyToken");

// ============= 설정 (프론트와 일치해야 함) =============
const GRID_W = 10; // 가로 10칸
const GRID_H = 5; // 세로 5칸
const CELL_PIXEL_W = 50; // 구역 내 가로 픽셀 수 (프론트 pixelSize * gridWidth / pixelSize)
const CELL_PIXEL_H = 50; // 구역 내 세로 픽셀 수
// =========================================================

// ✅ 내 구역 픽셀 저장/업데이트
router.post("/save", verifyToken, async (req, res) => {
  try {
    const { planetName, cellId, pixels } = req.body;
    const owner = req.user.id;

    if (
      !planetName ||
      !cellId ||
      !Array.isArray(pixels) ||
      pixels.some(
        (p) =>
          typeof p.x !== "number" ||
          typeof p.y !== "number" ||
          typeof p.color !== "string"
      )
    ) {
      return res.status(400).json({ message: "잘못된 요청" });
    }

    // 권한 체크: 이 유저가 해당 구역의 소유자인지(선택)
    // (이미 구현된 Purchase 모델이 있다면 여기서 검증)
    // const isOwner = await Purchase.exists({ planetName, cellId, owner });
    // if (!isOwner) return res.status(403).json({ message: "소유자가 아님" });

    const filter = { planetName, cellId, owner };
    const update = { $set: { pixels } };
    const opts = { upsert: true, new: true };

    const doc = await Pixel.findOneAndUpdate(filter, update, opts);
    res.json({ message: "✅ 픽셀 저장 완료", data: doc });
  } catch (err) {
    console.error("❌ 픽셀 저장 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 특정 행성의 모든 구역 픽셀(모든 유저) 조회 → 구경하기에서 사용
router.get("/planet/:planetName", async (req, res) => {
  try {
    const { planetName } = req.params;
    const docs = await Pixel.find({ planetName });
    res.json(docs);
  } catch (err) {
    console.error("❌ 행성 픽셀 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 특정 유저의 특정 행성 구역 픽셀 조회 → 에디터 입장 시 내 것 복원
router.get("/mine/:planetName/:cellId", verifyToken, async (req, res) => {
  try {
    const { planetName, cellId } = req.params;
    const owner = req.user.id;
    const doc = await Pixel.findOne({ planetName, cellId, owner });
    res.json(doc || { planetName, cellId, pixels: [] });
  } catch (err) {
    console.error("❌ 내 픽셀 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
