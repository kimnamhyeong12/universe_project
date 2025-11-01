const mongoose = require('mongoose');

const BlackholeSchema = new mongoose.Schema({
  name: String,
  mass: Number,              // 질량
  radius: Number,            // 반지름
  description: String,
  galaxy: { type: mongoose.Schema.Types.ObjectId, ref: 'Galaxy' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isForSale: Boolean
});

module.exports = mongoose.model('Blackhole', BlackholeSchema);
