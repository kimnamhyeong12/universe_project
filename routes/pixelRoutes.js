// ================================
// pixelRoutes.js — 픽셀 조회 / 좋아요 / 랭킹 API
// ================================
const express = require("express");
const router = express.Router();

const Pixel = require("../models/Pixel");
const Purchase = require("../models/Purchase");
const NFT = require("../models/NFT");
const verifyToken = require("../middleware/verifyToken");


// ====================================================================
// 🔥 1. 행성 전체 픽셀 조회
// ====================================================================
router.get("/planet/:planetName", async (req, res) => {
  try {
    const { planetName } = req.params;

    const pixelDocs = await Pixel.find({ planetName });
    const purchases = await Purchase.find({ planetName });

    const purchaseMap = {};
    purchases.forEach((p) => {
      purchaseMap[p.cellId] = {
        ownerId: p.owner?.toString(),
        ownerName: p.buyer || p.ownerName || "Unknown",
        isNft: p.isNft || false,
        nftId: p.sourceNft || null
      };
    });

    const result = pixelDocs.map((cell) => {
      const info = purchaseMap[cell.cellId] || {};

      return {
        _id: cell._id,
        planetName: cell.planetName,
        cellId: cell.cellId,
        pixels: cell.pixels || [],
        ownerId: info.ownerId || cell.owner,
        ownerName: info.ownerName || "Unknown",
        isNft: info.isNft || false,
        nftId: info.nftId || null,
        likes: cell.likes || 0,
        likedBy: cell.likedBy || [],
      };
    });

    res.json(result);
  } catch (err) {
    console.error("❌ planet 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


// ====================================================================
// 🔥 2. 좋아요 토글
// ====================================================================
router.post("/:pixelId/like", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { pixelId } = req.params;

    const pixel = await Pixel.findById(pixelId);
    if (!pixel) return res.status(404).json({ message: "Pixel not found" });

    const already = pixel.likedBy.map(String).includes(String(userId));

    if (already) {
      pixel.likes = Math.max(0, pixel.likes - 1);
      pixel.likedBy = pixel.llikedBy.filter((id) => String(id) !== String(userId));
    } else {
      pixel.likes += 1;
      pixel.likedBy.push(userId);
    }

    await pixel.save();

    res.json({
      likes: pixel.likes,
      isLiked: !already,
    });
  } catch (err) {
    console.error("❌ 좋아요 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


// ====================================================================
// 🔥 3. 픽셀 조회 (byToken)
// ====================================================================
router.get("/byToken/:token", verifyToken, async (req, res) => {
  try {
    const token = req.params.token;
    const userId = req.user.id;

    const purchase = await Purchase.findOne({ editToken: token });
    if (!purchase) return res.status(404).json({ message: "토큰 오류" });

    if (String(purchase.owner) !== userId)
      return res.status(403).json({ message: "소유자 아님" });

    const pixelDoc = await Pixel.findOne({
      planetName: purchase.planetName,
      cellId: purchase.cellId,
      owner: userId,
    });

    res.json({
      planetName: purchase.planetName,
      cellId: purchase.cellId,
      pixels: pixelDoc?.pixels || [],
    });
  } catch (err) {
    console.error("❌ byToken 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


// ====================================================================
// 🔥 4. 픽셀 저장
// ====================================================================
router.post("/saveByToken", verifyToken, async (req, res) => {
  try {
    const { token, pixels } = req.body;
    const userId = req.user.id;

    const purchase = await Purchase.findOne({ editToken: token });
    if (!purchase) return res.status(404).json({ message: "토큰 오류" });

    if (String(purchase.owner) !== userId)
      return res.status(403).json({ message: "소유자 아님" });

    const filter = {
      planetName: purchase.planetName,
      cellId: purchase.cellId,
      owner: userId,
    };

    const update = {
      $set: {
        planetName: purchase.planetName,
        cellId: purchase.cellId,
        owner: userId,
        pixels,
      },
    };

    const opts = { upsert: true, new: true };

    const doc = await Pixel.findOneAndUpdate(filter, update, opts);

    res.json({ message: "픽셀 저장 완료", data: doc });
  } catch (err) {
    console.error("❌ saveByToken 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


// ====================================================================
// 🔥 5. NFT 등록된 셀만 랭킹에 포함
//     가격, 조회수, 인기도 포함해서 RankingBoard에 전달
// ====================================================================
router.get("/ranking", async (req, res) => {
  try {
    // 1) NFT 등록된 셀만 가져오기
    const purchases = await Purchase.find({ isNft: true });

    if (!purchases.length) return res.json([]); // NFT 없으면 빈 배열

    const nftPixelCells = purchases.map((p) => ({
      cellId: p.cellId,
      planetName: p.planetName,
      ownerName: p.buyer,
      price: p.amount,
      nftId: p.sourceNft,
    }));

    const pixelDocs = await Pixel.find({
      $or: nftPixelCells.map((c) => ({
        planetName: c.planetName,
        cellId: c.cellId,
      })),
    });

    const result = pixelDocs.map((pixel) => {
      const info = nftPixelCells.find((n) => n.cellId === pixel.cellId);

      return {
        _id: pixel._id,
        planetName: pixel.planetName,
        cellId: pixel.cellId,
        pixels: pixel.pixels || [],
        ownerName: info?.ownerName || "Unknown",
        price: info?.price || 0,
        nftId: info?.nftId || null,
        likes: pixel.likes || 0,
        views: pixel.views || 0,
        updatedAt: pixel.updatedAt || pixel.createdAt,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("❌ NFT 랭킹 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


module.exports = router;
