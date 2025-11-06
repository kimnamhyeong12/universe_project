// backend/routes/pixelRoutes.js
const express = require("express");
const router = express.Router();
const Pixel = require("../models/Pixel");
const verifyToken = require("../middleware/verifyToken");

// ===== [공통 규격 - 프론트와 반드시 동일] =====
const GRID_W = 10;        // 행성 가로 셀 개수
const GRID_H = 10;        // 행성 세로 셀 개수 ✅ 수정
const CELL_PIXEL_W = 50;  // 셀 내부 가로 픽셀 수
const CELL_PIXEL_H = 50;  // 셀 내부 세로 픽셀 수
// ============================================


// ✅ 내 구역 픽셀 저장/업데이트 (upsert)
router.post("/save", verifyToken, async (req, res) => {
  try {
    const { planetName, cellId, pixels } = req.body;
    const owner = req.user?.id;

    if (!planetName || !cellId || !Array.isArray(pixels) || !owner) {
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }

    // 좌표 유효성 가볍게 체크
    const invalid = pixels.some(
      (p) =>
        typeof p?.x !== "number" ||
        typeof p?.y !== "number" ||
        p.x < 0 || p.y < 0 ||
        p.x >= CELL_PIXEL_W || p.y >= CELL_PIXEL_H ||
        typeof p?.color !== "string"
    );
    if (invalid) return res.status(400).json({ message: "좌표/색상 형식 오류" });

    const filter = { planetName, cellId, owner };
    const update = {
      $set: {
        planetName,
        cellId,
        owner,
        pixels,
      },
    };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    const doc = await Pixel.findOneAndUpdate(filter, update, opts);
    return res.json({ message: "✅ 픽셀 저장 완료", data: doc });
  } catch (err) {
    console.error("❌ 픽셀 저장 오류:", err);
    return res.status(500).json({ message: "서버 오류" });
  }
});


// ✅ 특정 행성의 모든 구역 픽셀(모든 유저)
router.get("/planet/:planetName", async (req, res) => {
  try {
    const { planetName } = req.params;
    const docs = await Pixel.find({ planetName });

    // 🔧 포맷 정규화
    const normalized = docs.map((cell) => {
      const cleanId = String(cell.cellId)
        .replace(/cell[_:,]/g, "")
        .replace(/[,]/g, "-")
        .trim();

      const pixels = (cell.pixels || []).map((p) => ({
        x: Number(p.x ?? p.posX ?? 0),
        y: Number(p.y ?? p.posY ?? 0),
        color: p.color ?? p.colorCode ?? "#00ffff",
      }));

      return { ...cell.toObject(), cellId: cleanId, pixels };
    });

    return res.json(normalized);
  } catch (err) {
    console.error("❌ 행성 픽셀 조회 오류:", err);
    return res.status(500).json({ message: "서버 오류" });
  }
});


// ✅ 내 픽셀(에디터 입장 시 복원)
router.get("/mine/:planetName/:cellId", verifyToken, async (req, res) => {
  try {
    const { planetName, cellId } = req.params;
    const owner = req.user?.id;
    const doc = await Pixel.findOne({ planetName, cellId, owner });
    return res.json(doc || { planetName, cellId, owner, pixels: [] });
  } catch (err) {
    console.error("❌ 내 픽셀 조회 오류:", err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
