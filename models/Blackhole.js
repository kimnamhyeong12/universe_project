const mongoose = require("mongoose");

const blackholeSchema = new mongoose.Schema({
  name: String,
  description: String,
  imageUrl: String,
  isForSale: Boolean,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Blackhole", blackholeSchema);
