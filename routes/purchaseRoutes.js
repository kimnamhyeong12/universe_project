const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { v4: uuidv4 } = require("uuid");
const Purchase = require("../models/Purchase"); // ✅ 모델 불러오기

// ✅ [POST] 구매 요청 — 이미 구매된 칸 중복 방지 포함
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planetName, cells } = req.body;

    if (!planetName || !Array.isArray(cells) || cells.length === 0) {
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }

    // 이미 구매된 셀 확인
    const existing = await Purchase.find({
      planetName,
      cellId: { $in: cells },
    });

    if (existing.length > 0) {
      return res.status(400).json({
        message: "이미 구매된 영역이 포함되어 있습니다.",
        occupiedCells: existing.map((e) => e.cellId),
      });
    }

    // ✅ 새로운 구매 생성 (각 셀마다 UUID editToken 부여)
    const purchases = await Promise.all(
      cells.map((cellId) =>
        Purchase.create({
          planetName,
          cellId,
          owner: userId,
          editToken: uuidv4(), // 🔑 편집용 UUID 생성
        })
      )
    );

    res.json({
      message: "✅ 구매 완료",
      data: purchases.map((p) => ({
        planetName: p.planetName,
        cellId: p.cellId,
        editToken: p.editToken, // ✅ 프론트에서 바로 사용 가능
      })),
    });
  } catch (err) {
    console.error("❌ 구매 처리 오류:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// ✅ [GET] 특정 행성의 구매 내역 조회
router.get("/:planetName", async (req, res) => {
  try {
    const { planetName } = req.params;
    const purchases = await Purchase.find({ planetName });
    res.json(purchases);
  } catch (err) {
    console.error("❌ 구매 내역 조회 오류:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// ✅ [GET] 로그인한 사용자의 구매 내역 조회
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }
    const purchases = await Purchase.find({ owner: userId });
    res.json(purchases);
  } catch (err) {
    console.error("❌ 사용자 구매 내역 조회 오류:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// ✅ [POST] 결제 완료 후 DB 반영 (Toss 성공 후 호출)
router.post("/confirm", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, paymentKey, amount, itemName, buyer, planetName, cells } = req.body;

    if (!planetName || !Array.isArray(cells) || cells.length === 0) {
      return res.status(400).json({ message: "❌ 저장할 구매 정보가 없습니다." });
    }

    // ✅ 결제 완료 시 editToken 생성
    const records = await Promise.all(
      cells.map((cellId) =>
        Purchase.create({
          planetName,
          cellId,
          owner: userId,
          orderId,
          paymentKey,
          amount,
          itemName,
          buyer,
          transactionDate: new Date(),
          editToken: uuidv4(), // 🔑 편집용 UUID 생성
        })
      )
    );

    console.log(`💾 ${records.length}개 셀 구매 정보 저장됨`);

    res.json({
      message: "✅ 결제 완료 및 구매정보 저장 성공",
      orderId,
      paymentKey,
      amount,
      planet: planetName,
      cells: records.map((r) => ({
        cellId: r.cellId,
        editToken: r.editToken, // ✅ 프론트에서 이걸로 /pixel/edit/:token 이동
      })),
    });
  } catch (err) {
    console.error("❌ 결제 구매정보 저장 실패:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  }
});

module.exports = router;
