const mongoose = require('mongoose');

const GalaxySchema = new mongoose.Schema({
  name: String,
  description: String,
  size: Number,              // 직경 (광년 단위 등)
  numberOfStars: Number,     // 포함된 별의 수
  discoveredBy: String,
  discoveredAt: Date,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isForSale: Boolean
});

module.exports = mongoose.model('Galaxy', GalaxySchema);
