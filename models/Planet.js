const mongoose = require('mongoose');

const PlanetSchema = new mongoose.Schema({
  name: String,
  description: String,
  imageUrl: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  price: Number,
  isForSale: Boolean
});

module.exports = mongoose.model('Planet', PlanetSchema);
