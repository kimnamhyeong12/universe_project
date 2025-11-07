const mongoose = require("mongoose");

const certSchema = new mongoose.Schema({
  certId: String,
  ownerUserId: String,
  ownerName: String,
  assetType: String,
  assetId: String,
  issuedAt: Date,
  hash: String,
  signature: String,
  pdfPath: String,
});

module.exports = mongoose.model("Certificate", certSchema);
