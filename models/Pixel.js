// backend/models/Pixel.js
const mongoose = require("mongoose");

const pixelSchema = new mongoose.Schema(
  {
    planetName: { type: String, required: true }, // 예: "수성"
    cellId: { type: String, required: true },     // 예: "1-0"
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // 🔥 좋아요(인기도) 시스템
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // 이 구역에서 찍힌 픽셀들 (로컬 좌표)
    pixels: [
      {
        x: { type: Number, required: true },      // 0 ~ (cellWidth/pixelSize - 1)
        y: { type: Number, required: true },
        color: { type: String, required: true },  // "#rrggbb"
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pixel", pixelSchema);
