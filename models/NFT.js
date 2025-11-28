// models/NFT.js
const mongoose = require("mongoose");

const NFTSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  ownerName: { type: String, required: true },

  planetName: { type: String, required: true },
  cellId: { type: String, required: true },

  // 캔버스 픽셀 정보
  pixels: { type: Array, default: [] },

  // 썸네일용 이미지 (처음 발행 시 캔버스 이미지 캡쳐)
  imageDataUrl: { type: String, required: true }, // Base64
  imageUrl: { type: String }, // (optional, 예전 방식)

  // 🔥 가격 관련
  // - basePrice: 최초 발행 시의 기준가격
  // - price: 현재 판매가 (좋아요에 따라 변동 가능)
  basePrice: { type: Number, default: 5000 },
  price: { type: Number, default: 5000 },

  // 판매 상태
  isListed: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("NFT", NFTSchema);
