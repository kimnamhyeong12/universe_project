const mongoose = require("mongoose");

// ✅ Purchase 모델 스키마 정의
const purchaseSchema = new mongoose.Schema({
  planetName: { type: String, required: true },
  cellId: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },

  // 💳 결제 정보
  orderId: { type: String },
  paymentKey: { type: String },
  itemName: { type: String },
  buyer: { type: String },
  amount: { type: Number },
  transactionDate: { type: Date },

  // 🧩 UUID 기반 편집 접근 토큰
  editToken: { type: String, unique: true },
});

// ✅ 중복 모델 등록 방지
module.exports =
  mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);
