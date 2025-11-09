const mongoose = require("mongoose");

const starSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  mass: Number,
  diameter: Number,
  temperature: Number,
  description: String,
  imageUrl: String,
  position: { // 은하 내 위치
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 },
  },
  galaxy: { type: mongoose.Schema.Types.ObjectId, ref: "Galaxy" }, // ⭐ 어느 은하에 속하는지
  isForSale: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Star", starSchema);
