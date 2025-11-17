// ✅ models/Point.js
const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }, // ✅ 여기가 정답
  balance: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});


module.exports = mongoose.models.Point || mongoose.model("Point", pointSchema);
