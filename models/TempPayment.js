const mongoose = require("mongoose");

const tempPaymentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  assetId: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, expires: "1h" }, // ⏰ 1시간 뒤 자동 삭제
});

module.exports = mongoose.model("TempPayment", tempPaymentSchema);
