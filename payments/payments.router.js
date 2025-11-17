// payments/payments.router.js

const express = require("express");
const router = express.Router();

const {
  confirmPayment,
  confirmPointPayment,
  getPointSessionInfo,
} = require("./payments.controller");

// 기존 마켓 결제 승인
router.post("/confirm", confirmPayment);

// 포인트 충전 승인
router.post("/confirm-point", confirmPointPayment);

// ⭐ FE 기준 맞춤
// 포인트 세션 조회
router.get("/point-session/:id", getPointSessionInfo);

// 마켓 세션 조회 (필요하면 참고)
router.get("/session/:id", getPointSessionInfo);

module.exports = router;

