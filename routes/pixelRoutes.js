// ================================
// pixelRoutes.js (최종 안정판)
// ================================
const express = require("express");
const router = express.Router();

const Pixel = require("../models/Pixel");
const Purchase = require("../models/Purchase");
const verifyToken = require("../middleware/verifyToken");

// ===== [프론트와 동일하게 유지해야 하는 규격] =====
const GRID_W = 10;        // 행성 가로 셀 갯수
const GRID_H = 10;        // 행성 세로 셀 갯수
const CELL_PIXEL_W = 50;  // 셀 내부 가로 픽셀
const CELL_PIXEL_H = 50;  // 셀 내부 세로 픽셀
// ================================================


/* ===========================================================
   [1] GET /api/pixels/byToken/:token
   → 사용자가 구매한 구역(셀)의 픽셀만 불러오기
   → PixelEditor에서 사용 (내 구역 편집)
=========================================================== */
router.get("/byToken/:token", verifyToken, async (req, res) => {
  try {
    const token = req.params.token;
    const userId = req.user?.id;

    if (!token)
      return res.status(400).json({ message: "잘못된 요청 (token 없음)" });

    // editToken 으로 구매 정보 찾기
    const purchase = await Purchase.findOne({ editToken: token });
    if (!purchase)
      return res.status(404).json({ message: "잘못된 접근 (구매 기록 없음)" });

    // 본인 소유인지 확인
    if (String(purchase.owner) !== userId)
      return res.status(403).json({ message: "해당 셀의 소유자가 아닙니다." });

    const { planetName, cellId } = purchase;

    // 픽셀 데이터 가져오기
    const pixelDoc = await Pixel.findOne({ planetName, cellId, owner: userId });

    res.json({
      planetName,
      cellId,
      pixels: pixelDoc?.pixels || [],
    });
  } catch (err) {
    console.error("❌ UUID 기반 픽셀 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


/* ===========================================================
   [2] POST /api/pixels/saveByToken
   → PixelEditor에서 저장하는 API
=========================================================== */
router.post("/saveByToken", verifyToken, async (req, res) => {
  try {
    const { token, pixels } = req.body;
    const userId = req.user?.id;

    if (!token || !Array.isArray(pixels))
      return res.status(400).json({ message: "잘못된 요청" });

    const purchase = await Purchase.findOne({ editToken: token });
    if (!purchase)
      return res.status(404).json({ message: "잘못된 접근 (토큰 오류)" });

    if (String(purchase.owner) !== userId)
      return res.status(403).json({ message: "셀 소유자가 아닙니다." });

    const { planetName, cellId } = purchase;

    // 좌표 유효성 검사
    const invalid = pixels.some(
      (p) =>
        typeof p.x !== "number" ||
        typeof p.y !== "number" ||
        p.x < 0 || p.y < 0 ||
        p.x >= CELL_PIXEL_W || p.y >= CELL_PIXEL_H ||
        typeof p.color !== "string"
    );
    if (invalid) return res.status(400).json({ message: "좌표 형식 오류" });

    // 저장 or upsert
    const filter = { planetName, cellId, owner: userId };
    const update = { $set: { planetName, cellId, owner: userId, pixels } };
    const opts = { upsert: true, new: true };

    const doc = await Pixel.findOneAndUpdate(filter, update, opts);

    res.json({ message: "픽셀 저장 완료", data: doc });
  } catch (err) {
    console.error("❌ 픽셀 저장 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


/* ===========================================================
   [3] GET /api/pixels/planet/:planetName
   → ViewPlanet에서 행성 전체 픽셀 + 각 셀 ownerName 제공
   → 마우스 hover 시 “누가 소유한 셀인지” 보여줄 때 사용
=========================================================== */
router.get("/planet/:planetName", async (req, res) => {
  try {
    const { planetName } = req.params;

    // 픽셀 문서 전체
    const pixelDocs = await Pixel.find({ planetName });

    // 구매 정보를 불러와서 ownerName JOIN
    const purchases = await Purchase.find({ planetName });

    const purchaseMap = {};
    purchases.forEach((p) => {
      purchaseMap[p.cellId] = {
        ownerId: p.owner?.toString(),
        ownerName: p.buyer || p.ownerName || p.username || "미확인 사용자",
      };
    });

    const result = pixelDocs.map((cell) => {
      const cleanId = String(cell.cellId)
        .replace(/cell[_:,]/g, "")
        .replace(/,/g, "-")
        .trim();

      const ownerInfo = purchaseMap[cleanId] || {};

      return {
        planetName: cell.planetName,
        cellId: cleanId,
        pixels: (cell.pixels || []).map((p) => ({
          x: Number(p.x),
          y: Number(p.y),
          color: p.color || "#00ffff",
        })),
        ownerId: ownerInfo.ownerId || cell.owner,
        ownerName: ownerInfo.ownerName || "미확인 사용자",
      };
    });

    res.json(result);
  } catch (err) {
    console.error("❌ 행성 전체 픽셀 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


/* ===========================================================
   [4] GET /api/pixels/mine/:planetName/:cellId
   → 하위 호환: 특정 셀 픽셀 직접 조회
=========================================================== */
router.get("/mine/:planetName/:cellId", verifyToken, async (req, res) => {
  try {
    const { planetName, cellId } = req.params;
    const owner = req.user.id;

    const doc = await Pixel.findOne({ planetName, cellId, owner });
    res.json(doc || { planetName, cellId, owner, pixels: [] });
  } catch (err) {
    console.error("❌ 내 픽셀 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


/* ===========================================================
   [5] POST /api/pixels/save (deprecated)
   → 옛 방식 저장 (token 기반 X)
=========================================================== */
router.post("/save", verifyToken, async (req, res) => {
  try {
    const { planetName, cellId, pixels } = req.body;
    const owner = req.user.id;

    if (!planetName || !cellId || !Array.isArray(pixels))
      return res.status(400).json({ message: "잘못된 요청" });

    const invalid = pixels.some(
      (p) =>
        typeof p.x !== "number" ||
        typeof p.y !== "number" ||
        p.x < 0 || p.y < 0 ||
        p.x >= CELL_PIXEL_W || p.y >= CELL_PIXEL_H
    );
    if (invalid)
      return res.status(400).json({ message: "좌표 형식 오류" });

    const filter = { planetName, cellId, owner };
    const update = { $set: { planetName, cellId, owner, pixels } };
    const opts = { upsert: true, new: true };

    const doc = await Pixel.findOneAndUpdate(filter, update, opts);
    res.json({ message: "픽셀 저장 완료", data: doc });
  } catch (err) {
    console.error("❌ 픽셀 저장 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
