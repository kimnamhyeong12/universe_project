const mongoose = require("mongoose");

const planetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  imageUrl: String,

  galaxy: { type: mongoose.Schema.Types.ObjectId, ref: "Galaxy" },
  star: { type: mongoose.Schema.Types.ObjectId, ref: "Star" }, // 중요! 어떤 별을 도는지

  orbitRadius: { type: Number, default: 10 },  // 중심별 기준 거리
  orbitSpeed: { type: Number, default: 0.01 }, // 회전 속도

  price: { type: Number, default: 0 },
  isForSale: { type: Boolean, default: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Planet", planetSchema);
