const mongoose = require("mongoose");

const TempPointPaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },        // 실제 결제 금액 (원화 기준)
  points: { type: Number, required: true },        // 지급할 총 포인트 (보너스 포함)
  sessionId: { type: String, required: true, unique: true },
  status: { type: String, default: "pending" },    // pending, paid, failed
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TempPointPayment", TempPointPaymentSchema);
