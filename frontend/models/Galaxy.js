const mongoose = require("mongoose");

const galaxySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  imageUrl: String,
  position: { // 은하의 우주상 위치
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 },
  },
  isForSale: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Galaxy", galaxySchema);
