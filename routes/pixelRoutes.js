<<<<<<< HEAD
const express = require("express");
const router = express.Router();
const Pixel = require("../models/Pixel");
const Purchase = require("../models/Purchase"); // ✅ 구매 모델 추가
=======
// backend/routes/pixelRoutes.js
const express = require("express");
const router = express.Router();
const Pixel = require("../models/Pixel");
>>>>>>> 77b18ee264602059b9c3af338aaaa08162b6331f
const verifyToken = require("../middleware/verifyToken");

// ===== [공통 규격 - 프론트와 반드시 동일] =====
const GRID_W = 10;        // 행성 가로 셀 개수
<<<<<<< HEAD
const GRID_H = 10;        // 행성 세로 셀 개수
=======
const GRID_H = 10;        // 행성 세로 셀 개수 ✅ 수정
>>>>>>> 77b18ee264602059b9c3af338aaaa08162b6331f
const CELL_PIXEL_W = 50;  // 셀 내부 가로 픽셀 수
const CELL_PIXEL_H = 50;  // 셀 내부 세로 픽셀 수
// ============================================


<<<<<<< HEAD
// ✅ [1] UUID 기반 내 구역 픽셀 조회
router.get("/byToken/:token", verifyToken, async (req, res) => {
  try {
    const token = req.params.token;
    const userId = req.user?.id;

    if (!token) {
      return res.status(400).json({ message: "잘못된 요청입니다. (토큰 누락)" });
    }

    // 구매 정보 확인
    const purchase = await Purchase.findOne({ editToken: token });
    if (!purchase) {
      return res.status(404).json({ message: "잘못된 접근입니다. (유효하지 않은 토큰)" });
    }

    // 본인 소유 확인
    const ownerId = purchase.owner?.toString() || purchase.ownerId?.toString();
    if (ownerId !== userId) {
      return res.status(403).json({ message: "이 구역의 소유자가 아닙니다." });
    }

    const { planetName, cellId } = purchase;
    const doc = await Pixel.findOne({ planetName, cellId, owner: userId });

    return res.json({
      planetName,
      cellId,
      pixels: doc?.pixels || [],
    });
  } catch (err) {
    console.error("❌ UUID 기반 픽셀 조회 오류:", err);
    return res.status(500).json({ message: "서버 오류" });
  }
});


// ✅ [2] UUID 기반 픽셀 저장
router.post("/saveByToken", verifyToken, async (req, res) => {
  try {
    const { token, pixels } = req.body;
    const userId = req.user?.id;

    if (!token || !Array.isArray(pixels)) {
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }

    const purchase = await Purchase.findOne({ editToken: token });
    if (!purchase) {
      return res.status(404).json({ message: "잘못된 접근입니다. (유효하지 않은 토큰)" });
    }

    const ownerId = purchase.owner?.toString() || purchase.ownerId?.toString();
    if (ownerId !== userId) {
      return res.status(403).json({ message: "이 구역의 소유자가 아닙니다." });
    }

    const { planetName, cellId } = purchase;

    // 좌표 유효성 검증
=======
// ✅ 내 구역 픽셀 저장/업데이트 (upsert)
router.post("/save", verifyToken, async (req, res) => {
  try {
    const { planetName, cellId, pixels } = req.body;
    const owner = req.user?.id;

    if (!planetName || !cellId || !Array.isArray(pixels) || !owner) {
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }

    // 좌표 유효성 가볍게 체크
>>>>>>> 77b18ee264602059b9c3af338aaaa08162b6331f
    const invalid = pixels.some(
      (p) =>
        typeof p?.x !== "number" ||
        typeof p?.y !== "number" ||
        p.x < 0 || p.y < 0 ||
        p.x >= CELL_PIXEL_W || p.y >= CELL_PIXEL_H ||
        typeof p?.color !== "string"
    );
    if (invalid) return res.status(400).json({ message: "좌표/색상 형식 오류" });

<<<<<<< HEAD
    const filter = { planetName, cellId, owner: userId };
    const update = { $set: { planetName, cellId, owner: userId, pixels } };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

    const doc = await Pixel.findOneAndUpdate(filter, update, opts);

    return res.json({ message: "✅ 픽셀 저장 완료", data: doc });
  } catch (err) {
    console.error("❌ UUID 기반 픽셀 저장 오류:", err);
=======
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
>>>>>>> 77b18ee264602059b9c3af338aaaa08162b6331f
    return res.status(500).json({ message: "서버 오류" });
  }
});


<<<<<<< HEAD
// ✅ [3] 특정 행성의 전체 픽셀 (지도용)
=======
// ✅ 특정 행성의 모든 구역 픽셀(모든 유저)
>>>>>>> 77b18ee264602059b9c3af338aaaa08162b6331f
router.get("/planet/:planetName", async (req, res) => {
  try {
    const { planetName } = req.params;
    const docs = await Pixel.find({ planetName });

<<<<<<< HEAD
=======
    // 🔧 포맷 정규화
>>>>>>> 77b18ee264602059b9c3af338aaaa08162b6331f
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


<<<<<<< HEAD
// ✅ [4] (하위 호환) 내 픽셀 조회
=======
// ✅ 내 픽셀(에디터 입장 시 복원)
>>>>>>> 77b18ee264602059b9c3af338aaaa08162b6331f
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

<<<<<<< HEAD

// ✅ [5] (하위 호환) planetName 기반 저장
router.post("/save", verifyToken, async (req, res) => {
  try {
    const { planetName, cellId, pixels } = req.body;
    const owner = req.user?.id;

    if (!planetName || !cellId || !Array.isArray(pixels) || !owner) {
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }

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
    const update = { $set: { planetName, cellId, owner, pixels } };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

    const doc = await Pixel.findOneAndUpdate(filter, update, opts);
    return res.json({ message: "✅ 픽셀 저장 완료", data: doc });
  } catch (err) {
    console.error("❌ 픽셀 저장 오류:", err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

=======
>>>>>>> 77b18ee264602059b9c3af338aaaa08162b6331f
module.exports = router;
