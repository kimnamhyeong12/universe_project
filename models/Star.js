const mongoose = require('mongoose');

const StarSchema = new mongoose.Schema({
  name: String,
  type: String,              // 별 종류 (예: 적색왜성, 초거성 등)
  mass: Number,              // 질량
  radius: Number,            // 반지름
  temperature: Number,       // 표면 온도
  galaxy: { type: mongoose.Schema.Types.ObjectId, ref: 'Galaxy' },
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isForSale: Boolean
});

module.exports = mongoose.model('Star', StarSchema);
