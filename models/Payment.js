const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assetType: { 
    type: String, 
    enum: ["Planet", "Star", "Galaxy", "Blackhole"], 
    required: true 
  },
  asset: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: "assetType", // 동적으로 연결 (행성/별/갤럭시/블랙홀)
    required: true 
  },
  amount: { type: Number, required: true }, // 결제 금액
  currency: { type: String, default: "KRW" },
  paymentMethod: { 
    type: String, 
    enum: ["mock", "credit_card", "kakaopay", "paypal"], 
    default: "mock" 
  },
  status: { 
    type: String, 
    enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"], 
    default: "PENDING" 
  },
  transactionId: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date },
  receiptUrl: { type: String },
});

module.exports = mongoose.model("Payment", PaymentSchema);
