// routes/nft.js
const express = require("express");
const router = express.Router();

const NFT = require("../models/NFT");
const User = require("../models/User");
const Point = require("../models/Point");
const PointTransaction = require("../models/PointTransaction");
const Purchase = require("../models/Purchase");
const Pixel = require("../models/Pixel");
const { v4: uuidv4 } = require("uuid");
const verifyToken = require("../middleware/verifyToken");

const Certificate = require("../models/Certificate");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// ==================================================
// 🔧 좋아요 기반 동적 가격 계산 함수
//    - NFT.basePrice / price를 기준으로
//    - Pixel.likes / likedBy 길이를 이용해서 가산
// ==================================================
async function calcDynamicPrice(nft) {
  const basePrice =
    typeof nft.basePrice === "number" ? nft.basePrice : nft.price || 5000;

  const pixel = await Pixel.findOne({
    planetName: nft.planetName,
    cellId: nft.cellId,
    owner: nft.owner,
  });

  let likeCount = 0;
  if (pixel) {
    if (Array.isArray(pixel.likedBy)) {
      likeCount = pixel.likedBy.length;
    } else if (typeof pixel.likes === "number") {
      likeCount = pixel.likes;
    }
  }

  const dynamicPrice = basePrice + likeCount * 100;
  return dynamicPrice;
}

// ==================================================
// 두 픽셀 배열이 같은지 비교 (x, y, color 모두)
// ==================================================
function pixelsEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    const pa = a[i];
    const pb = b[i];
    if (!pa || !pb) return false;
    if (pa.x !== pb.x || pa.y !== pb.y || pa.color !== pb.color) {
      return false;
    }
  }
  return true;
}

// ==================================================
// NFT 인증서용 해시 생성
//  - owner 이름은 포함 안 함 (현재 소유자는 NFT에서 실시간 조회)
// ==================================================
function createNftCertHash(payload) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

// ==================================================
// data:image/png;base64,... → Buffer 변환
// ==================================================
function dataUrlToBuffer(dataUrl) {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:.+;base64,(.+)$/);
  const base64 = match ? match[1] : dataUrl;
  return Buffer.from(base64, "base64");
}

// ==================================================
// 1) NFT 발행 (셀 → NFT)
//    POST /api/nft/mint
//    body: { token, planetName, cellId, pixels, imageDataUrl }
// ==================================================
router.post("/mint", verifyToken, async (req, res) => {
  try {
    const { token, planetName, cellId, pixels, imageDataUrl } = req.body;
    const userId = req.user.id;
    const ownerName = req.user.username;

    if (!token || !planetName || !cellId || !pixels || !imageDataUrl) {
      return res.status(400).json({ message: "필수 값이 누락되었습니다." });
    }

    const purchase = await Purchase.findOne({
      editToken: token,
      owner: userId,
      planetName,
      cellId,
    });

    if (!purchase) {
      return res.status(403).json({
        message: "해당 셀의 소유자가 아니거나 토큰이 유효하지 않습니다.",
      });
    }

    if (purchase.isNft === true) {
      return res.status(400).json({
        message: "이미 NFT로 발행된 셀입니다.",
      });
    }

    const basePrice = 5000;
    const nft = await NFT.create({
      owner: userId,
      ownerName,
      planetName,
      cellId,
      pixels,
      imageDataUrl,
      basePrice,
      price: basePrice,
      isListed: false,
    });

    purchase.isNft = true;
    purchase.sourceNft = nft._id;
    await purchase.save();

    await Pixel.findOneAndUpdate(
      { planetName, cellId, owner: userId },
      {
        planetName,
        cellId,
        owner: userId,
        pixels,
        likes: 0,
        likedBy: [],
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: "NFT 발행 완료",
      nft,
    });
  } catch (err) {
    console.error("❌ NFT mint error:", err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

// ==================================================
// 2) NFT 마켓 목록 (판매중인 것만, 동적 가격 적용)
//    GET /api/nft/market
// ==================================================
router.get("/market", async (req, res) => {
  try {
    const list = await NFT.find({ isListed: true });

    const withPrice = await Promise.all(
      list.map(async (nft) => {
        const dynPrice = await calcDynamicPrice(nft);
        const obj = nft.toObject();
        obj.price = dynPrice;
        return obj;
      })
    );

    res.json(withPrice);
  } catch (err) {
    console.error("❌ NFT market error:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ==================================================
// 3) 내 NFT 목록 (마이페이지용, 동적 가격 포함)
//    GET /api/nft/mine
// ==================================================
router.get("/mine", verifyToken, async (req, res) => {
  try {
    const myList = await NFT.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });

    const withPrice = await Promise.all(
      myList.map(async (nft) => {
        const dynPrice = await calcDynamicPrice(nft);
        const obj = nft.toObject();
        obj.price = dynPrice;
        return obj;
      })
    );

    res.json({ success: true, nfts: withPrice });
  } catch (err) {
    console.error("❌ NFT mine error:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ==================================================
// 4) NFT 편집용 데이터 로딩
//    GET /api/nft/editor/:nftId
// ==================================================
router.get("/editor/:nftId", verifyToken, async (req, res) => {
  try {
    const nftId = req.params.nftId;
    const userId = req.user.id;

    const nft = await NFT.findById(nftId);
    if (!nft) {
      return res.status(404).json({ message: "NFT를 찾을 수 없습니다." });
    }

    if (String(nft.owner) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "이 NFT를 편집할 권한이 없습니다." });
    }

    const dynPrice = await calcDynamicPrice(nft);

    return res.json({
      success: true,
      planetName: nft.planetName,
      cellId: nft.cellId,
      pixels: nft.pixels || [],
      isListed: nft.isListed,
      price: dynPrice,
    });
  } catch (err) {
    console.error("NFT editor GET error:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ==================================================
// 5) NFT 픽셀 수정 저장
//    POST /api/nft/update/:nftId
// ==================================================
async function handleNftUpdate(req, res) {
  try {
    const nftId = req.params.nftId || req.params.id;
    const userId = req.user.id;
    const { pixels, imageDataUrl } = req.body;

    const nft = await NFT.findById(nftId);
    if (!nft) {
      return res.status(404).json({ message: "NFT를 찾을 수 없습니다." });
    }

    if (String(nft.owner) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "이 NFT를 수정할 권한이 없습니다." });
    }

    if (nft.isListed) {
      return res.status(400).json({
        message:
          "판매 중인 NFT입니다. 먼저 상점 등록을 취소한 뒤 수정하세요.",
      });
    }

    const newPixels = Array.isArray(pixels) ? pixels : [];
    const oldPixels = Array.isArray(nft.pixels) ? nft.pixels : [];

    const changed = !pixelsEqual(oldPixels, newPixels);

    nft.pixels = newPixels;
    if (imageDataUrl) {
      nft.imageDataUrl = imageDataUrl;
    }

    if (changed) {
      await Pixel.findOneAndUpdate(
        {
          planetName: nft.planetName,
          cellId: nft.cellId,
          owner: userId,
        },
        {
          planetName: nft.planetName,
          cellId: nft.cellId,
          owner: userId,
          pixels: newPixels,
          likes: 0,
          likedBy: [],
        },
        { upsert: true, new: true }
      );

      const base = typeof nft.basePrice === "number" ? nft.basePrice : 5000;
      nft.price = base;

      await nft.save();

      return res.json({
        success: true,
        likesReset: true,
        price: nft.price,
      });
    } else {
      await Pixel.findOneAndUpdate(
        {
          planetName: nft.planetName,
          cellId: nft.cellId,
          owner: userId,
        },
        {
          planetName: nft.planetName,
          cellId: nft.cellId,
          owner: userId,
          pixels: newPixels,
        },
        { upsert: true, new: true }
      );

      await nft.save();

      const dynPrice = await calcDynamicPrice(nft);
      return res.json({
        success: true,
        likesReset: false,
        price: dynPrice,
      });
    }
  } catch (err) {
    console.error("NFT update error:", err);
    res.status(500).json({ message: "서버 오류" });
  }
}

router.post("/update/:nftId", verifyToken, handleNftUpdate);
router.post("/editor/:id", verifyToken, handleNftUpdate);

// ==================================================
// 6) NFT 구매 (동적 가격 기준)
//    POST /api/nft/buy
//    body: { nftId }
// ==================================================
router.post("/buy", verifyToken, async (req, res) => {
  try {
    const { nftId } = req.body;
    const buyerId = req.user.id;
    const buyerName = req.user.username;

    const nft = await NFT.findById(nftId);
    if (!nft) {
      return res
        .status(404)
        .json({ success: false, message: "NFT를 찾을 수 없습니다." });
    }

    if (!nft.isListed) {
      return res
        .status(400)
        .json({ success: false, message: "현재 판매중이 아닌 NFT입니다." });
    }

    if (String(nft.owner) === String(buyerId)) {
      return res
        .status(400)
        .json({ success: false, message: "자신의 NFT는 구매할 수 없습니다." });
    }

    const price = await calcDynamicPrice(nft);

    let buyerPoint = await Point.findOne({ user: buyerId });
    if (!buyerPoint) {
      buyerPoint = await Point.create({ user: buyerId, balance: 0 });
    }

    if (buyerPoint.balance < price) {
      return res
        .status(400)
        .json({ success: false, message: "포인트가 부족합니다." });
    }

    let sellerPoint = await Point.findOne({ user: nft.owner });
    if (!sellerPoint) {
      sellerPoint = await Point.create({ user: nft.owner, balance: 0 });
    }

    buyerPoint.balance -= price;
    sellerPoint.balance += price;

    await buyerPoint.save();
    await sellerPoint.save();

    await PointTransaction.create({
      user: buyerId,
      amount: -price,
      type: "nft_purchase_fee",
      description: `NFT 구매: ${nft.planetName} ${nft.cellId}`,
    });

    await PointTransaction.create({
      user: nft.owner,
      amount: price,
      type: "nft_sale",
      description: `NFT 판매: ${nft.planetName} ${nft.cellId}`,
    });

    const sellerId = nft.owner;

    nft.owner = buyerId;
    nft.ownerName = buyerName;
    nft.isListed = false;
    await nft.save();

    const purchase = await Purchase.findOne({
      sourceNft: nft._id,
    });

    if (purchase) {
      purchase.owner = buyerId;
      purchase.buyer = buyerName;
      purchase.editToken = uuidv4();
      await purchase.save();
    }

    await Pixel.updateOne(
      {
        planetName: nft.planetName,
        cellId: nft.cellId,
        owner: sellerId,
      },
      { $set: { owner: buyerId } }
    );

    return res.json({
      success: true,
      message: "NFT 구매 완료",
      newBalance: buyerPoint.balance,
      priceUsed: price,
    });
  } catch (err) {
    console.error("❌ NFT buy error:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ==================================================
// 7) 상점 등록 / 등록 취소
//    POST /api/nft/list/:id
//    POST /api/nft/unlist/:id
// ==================================================
router.post("/list/:id", verifyToken, async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) {
      return res
        .status(404)
        .json({ success: false, message: "NFT를 찾을 수 없습니다." });
    }

    if (String(nft.owner) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "권한 없음" });
    }

    nft.isListed = true;
    await nft.save();

    res.json({ success: true, nft });
  } catch (err) {
    console.error("❌ NFT list error:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

router.post("/unlist/:id", verifyToken, async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) {
      return res
        .status(404)
        .json({ success: false, message: "NFT를 찾을 수 없습니다." });
    }

    if (String(nft.owner) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "권한 없음" });
    }

    nft.isListed = false;
    await nft.save();

    res.json({ success: true, nft });
  } catch (err) {
    console.error("❌ NFT unlist error:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ==============================================
// 8) NFT 인증서 발급 (PDF + QR + 해시 + Certificate 컬렉션)
// POST /api/nft/certificate/:nftId
//  - PDF 안에는 소유자 이름은 굳이 크게 안 넣고,
//  - QR 찍어서 프론트 /nft/verify/:nftId → 거기서 실제 소유자 보여줌
// ==============================================
router.post("/certificate/:nftId", verifyToken, async (req, res) => {
  try {
    const nftId = req.params.nftId;
    const userId = req.user.id;

    const nft = await NFT.findById(nftId);
    if (!nft) {
      return res.status(404).json({ message: "NFT를 찾을 수 없습니다." });
    }

    if (String(nft.owner) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "이 NFT에 대한 인증서를 발급할 권한이 없습니다." });
    }

    const issuedAt = new Date();

    // 해시용 payload (owner 이름 제외)
    const payload = {
      nftId: nft._id.toString(),
      planetName: nft.planetName,
      cellId: nft.cellId,
      issuedAt: issuedAt.toISOString(),
    };
    const hash = createNftCertHash(payload);

    // Certificate 컬렉션 기록
    const certDoc = new Certificate({
      ownerUserId: nft.owner,
      ownerName: nft.ownerName || req.user.username,
      planetName: nft.planetName,
      cellId: nft.cellId,
      transactionDate: issuedAt,
      objectId: nft._id,
      hash,
    });
    await certDoc.save();

    const chunks = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const fontDir = path.join(__dirname, "../fonts");
    try {
      doc.registerFont(
        "ScriptFont",
        path.join(fontDir, "Parisienne-Regular.ttf")
      );
      doc.registerFont(
        "SerifItalicFont",
        path.join(fontDir, "DMSerifText-Italic.ttf")
      );
    } catch (fontErr) {
      console.error(
        "⚠️ NFT 인증서 폰트 로딩 실패, 기본 폰트 사용:",
        fontErr.message
      );
      doc.registerFont("ScriptFont", "Helvetica");
      doc.registerFont("SerifItalicFont", "Helvetica-Oblique");
    }

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="nft-certificate-${nft._id}.pdf"`
      );
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.send(pdfBuffer);
    });

    // === [PDF 디자인] ===
    const bgPath = path.join(
      __dirname,
      "../frontend/public/textures",
      "space.png"
    );
    if (fs.existsSync(bgPath)) {
      doc.image(bgPath, 0, 0, {
        width: doc.page.width,
        height: doc.page.height,
      });
    } else {
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#050914");
      doc.fillColor("#FFFFFF");
    }

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc
      .font("ScriptFont")
      .fontSize(36)
      .fillColor("#ffffff")
      .text("Celestia NFT Certificate", 0, 90, { align: "center" });

    doc
      .font("SerifItalicFont")
      .fontSize(14)
      .fillColor("#b0e6ff")
      .text("SCAN TO VERIFY OWNERSHIP", 0, 135, {
        align: "center",
        characterSpacing: 2,
      });

    doc.moveDown(2);
    doc
      .font("SerifItalicFont")
      .fontSize(12)
      .fillColor("#ffffff")
      .text(`NFT ID : ${nft._id}`, {
        align: "center",
      });
    doc
      .text(`Planet : ${nft.planetName}`, { align: "center" })
      .text(`Cell   : ${nft.cellId}`, { align: "center" });

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor("#c0c0c0")
      .text(
        `Issued At : ${issuedAt
          .toISOString()
          .slice(0, 19)
          .replace("T", " ")}`,
        { align: "center" }
      );

    doc.moveDown(1);
    doc
      .fontSize(9)
      .fillColor("#999999")
      .text(`Hash : ${hash}`, 70, doc.y, {
        width: pageWidth - 140,
        align: "center",
      });

    // NFT 이미지 (있으면)
    if (nft.imageDataUrl) {
      try {
        const imgBuffer = dataUrlToBuffer(nft.imageDataUrl);
        if (imgBuffer) {
          const imgBoxW = 260;
          const imgBoxH = 260;
          const imgX = (pageWidth - imgBoxW) / 2;
          const imgY = 220;

          doc
            .save()
            .roundedRect(imgX - 6, imgY - 6, imgBoxW + 12, imgBoxH + 12, 16)
            .lineWidth(1.5)
            .strokeOpacity(0.6)
            .stroke("#50e3ff")
            .restore();

          doc.image(imgBuffer, imgX, imgY, {
            width: imgBoxW,
            height: imgBoxH,
          });
        }
      } catch (imgErr) {
        console.warn(
          "⚠️ NFT 인증서 이미지 렌더링 실패:",
          imgErr.message
        );
      }
    }

    // QR 코드 (우하단) → 프론트 /nft/verify/:nftId
    const verifyUrlBase =
      process.env.FRONTEND_BASE_URL || "http://localhost:5173";
    const verifyUrl = `${verifyUrlBase}/nft/verify/${nft._id}`;

    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      width: 300,
    });
    const qrBuffer = dataUrlToBuffer(qrDataUrl);

    if (qrBuffer) {
      const qrSize = 120;
      const margin = 60;
      const qrX = pageWidth - qrSize - margin;
      const qrY = pageHeight - qrSize - margin;

      doc.image(qrBuffer, qrX, qrY, {
        width: qrSize,
        height: qrSize,
      });

      doc
        .font("SerifItalicFont")
        .fontSize(9)
        .fillColor("#ffffff")
        .text("Scan to verify this NFT", qrX, qrY - 16, {
          width: qrSize,
          align: "center",
        });

      // URL 텍스트도 하단에 출력 (QR 안될 때 대비)
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#dddddd")
        .text(
          verifyUrl,
          qrX - 40,
          qrY + qrSize + 10,
          { width: qrSize + 80, align: "center" }
        );
    }

    doc
      .font("SerifItalicFont")
      .fontSize(9)
      .fillColor("#888888")
      .text(
        "© 2025 CELESTIA SPACE REGISTRY — All Rights Reserved.",
        0,
        pageHeight - 40,
        { align: "center" }
      );

    doc.end();
  } catch (err) {
    console.error("❌ NFT 인증서 발급 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ==============================================
// 9) NFT 인증 정보 조회 (QR용)
// GET /api/nft/verify/:nftId
//  - 프론트가 원하는 구조: { success, nft: {...} }
// ==============================================
router.get("/verify/:nftId", async (req, res) => {
  try {
    const nftId = req.params.nftId;

    // NFT 정보 + owner username 가져오기
    const nft = await NFT.findById(nftId).populate("owner", "username");
    if (!nft) {
      return res.status(404).json({
        success: false,
        message: "NFT를 찾을 수 없습니다."
      });
    }

    // 최근 발급된 인증서
    const cert = await Certificate.findOne({ objectId: nftId })
      .sort({ transactionDate: -1 })
      .lean();

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: "해당 NFT에 대한 인증서 발급 이력이 없습니다."
      });
    }

    // 🔐 해시 검증
    const payload = {
      nftId: nft._id.toString(),
      planetName: nft.planetName,
      cellId: nft.cellId,
      issuedAt: cert.transactionDate.toISOString(),
    };
    const expectedHash = createNftCertHash(payload);
    const verified = expectedHash === cert.hash;

    // ⭐ 프론트가 원하는 구조(nft: {...}) 로 반환
    return res.json({
      success: true,
      nft: {
        nftId: nft._id,
        ownerName: nft.ownerName || nft.owner?.username,
        planetName: nft.planetName,
        cellId: nft.cellId,
        imageDataUrl: nft.imageDataUrl,     // 🔥 프론트 이미지 표시 가능!
        updatedAt: cert.transactionDate,    // 발급일
        verified,                            // 해시 검증 결과
        hash: cert.hash,                     // 해시 원본
      },
    });
  } catch (err) {
    console.error("❌ NFT verify 오류:", err);
    res.status(500).json({
      success: false,
      message: "서버 오류"
    });
  }
});


module.exports = router;
