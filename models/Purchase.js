import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  planetName: { type: String, required: true },  // 예: "화성"
  cellId: { type: String, required: true },      // 예: "3-5"
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  purchasedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Purchase", purchaseSchema);
