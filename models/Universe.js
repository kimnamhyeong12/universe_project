const mongoose = require('mongoose');

const UniverseSchema = new mongoose.Schema({
  name: { type: String, required: true },           // 우주 이름
  description: { type: String },                    // 설명
  age: { type: Number },                            // 나이(예: 억년)
  galaxiesCount: { type: Number },                  // 포함된 은하 수
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 생성자
  isForSale: { type: Boolean, default: false }      // 판매 여부
});

module.exports = mongoose.model('Universe', UniverseSchema);
