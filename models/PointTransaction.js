// models/PointTransaction.js
const mongoose = require("mongoose");

const pointTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // 🔥 userId ❌ , user ✔

  amount: { type: Number, required: true }, // +충전, -사용

  type: {
    type: String,
    enum: [
      "charge",           // 🔵 포인트 충전
      "spend",            // 🔴 포인트 사용 (마켓 구매)
      "bonus",
      "nft_sale",
      "nft_purchase_fee",
    ],
    required: true,
  },

  description: { type: String },

  createdAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.PointTransaction ||
  mongoose.model("PointTransaction", pointTransactionSchema);
