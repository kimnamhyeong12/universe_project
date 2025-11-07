<<<<<<< HEAD
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
=======
import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  // 🌍 기존 필드 (행성 셀 정보)
  planetName: { type: String, required: true }, // 예: "화성"
  cellId: { type: String, required: true },     // 예: "3-5"
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  purchasedAt: { type: Date, default: Date.now },

  // 💳 신규 필드 (결제 정보)
  orderId: { type: String }, // Toss 주문 ID
  paymentKey: { type: String }, // Toss 결제 키
  itemName: { type: String }, // 예: "화성 셀 3-5"
  buyer: { type: String }, // 결제자 이름
  amount: { type: Number }, // 결제 금액
  transactionDate: { type: Date }, // 실제 결제 완료 시각
});

export default mongoose.model("Purchase", purchaseSchema);
>>>>>>> 77b18ee264602059b9c3af338aaaa08162b6331f
