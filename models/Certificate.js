const mongoose = require("mongoose");

const certSchema = new mongoose.Schema({
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ownerName: { type: String, required: true },
  planetName: { type: String, required: true },
  cellId: { type: String, required: true },
  transactionDate: { type: Date, required: true },
  pdfPath: { type: String },
  objectId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Purchase ObjectId
  hash: { type: String },
});

module.exports = mongoose.model("Certificate", certSchema);

