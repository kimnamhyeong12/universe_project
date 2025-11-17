// payments/payments.controller.js

const TempPointPayment = require("../models/TempPointPayment");
const Point = require("../models/Point");
const PointTransaction = require("../models/PointTransaction");

// ================================
// ⭐ 1) 기존 마켓 결제 승인 (그대로 유지)
// ================================
async function confirmPayment(req, res) {
  try {
    return res.json({
      message: "결제 승인 완료 (포인트 거래에는 미사용)",
    });
  } catch (err) {
    console.error("❌ 결제 확인 오류:", err);
    res.status(500).json({ message: "결제 승인 실패" });
  }
}

// ================================
// ⭐ 2) 포인트 충전 승인 (Toss 승인 제거 버전)
// ================================
async function confirmPointPayment(req, res) {
  try {
    const { sessionId } = req.body;

    // (1) 세션 확인
    const temp = await TempPointPayment.findOne({ sessionId });
    if (!temp) {
      return res.status(404).json({ message: "결제 세션을 찾을 수 없습니다." });
    }

    if (temp.status !== "pending") {
      return res.status(400).json({ message: "이미 처리된 결제입니다." });
    }

    // (2) 상태 변경
    temp.status = "paid";
    await temp.save();

    const userId = temp.userId;

    // (3) 잔액 업데이트
    let point = await Point.findOne({ user: userId });

    if (!point) {
      point = new Point({
        user: userId,
        balance: temp.points,
      });
    } else {
      point.balance += temp.points;
    }

    await point.save();

    // (4) 거래내역 저장
    await PointTransaction.create({
      user: userId,
      amount: temp.points,
      type: "charge",
      description: `${temp.amount}원 → ${temp.points}P 충전`,
    });

    console.log(`💰 포인트 충전 완료: ${userId} / +${temp.points}P`);

    return res.json({
      message: "포인트 충전 성공",
    });

  } catch (err) {
    console.error("❌ 포인트 결제 확인 실패:", err);
    return res.status(500).json({ message: "결제 확인 실패" });
  }
}

// ================================
// ⭐ 3) 포인트 결제 세션 조회
// ================================
async function getPointSessionInfo(req, res) {
  try {
    const { id } = req.params;

    const session = await TempPointPayment.findOne({ sessionId: id });

    if (!session) {
      return res.status(404).json({ message: "세션을 찾을 수 없습니다." });
    }

    return res.json({
      sessionId: session.sessionId,
      amount: session.amount,
      points: session.points,
      userId: session.userId,
      status: session.status,
    });

  } catch (err) {
    console.error("❌ 세션 조회 오류:", err);
    res.status(500).json({ message: "세션 조회 실패" });
  }
}

module.exports = {
  confirmPayment,
  confirmPointPayment,
  getPointSessionInfo,
};
