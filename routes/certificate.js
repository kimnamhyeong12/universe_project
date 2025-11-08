const express = require("express");
const path = require("path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const crypto = require("crypto");
const sharp = require("sharp");
const fs = require("fs");

const Certificate = require("../models/Certificate");
const Purchase = require("../models/Purchase");
const { authMiddleware } = require("../utils/authMiddleware");

const router = express.Router();

function createHash(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

const planetMap = {
  "수성": "Mercury",
  "금성": "Venus",
  "지구": "Earth",
  "화성": "Mars",
  "목성": "Jupiter",
  "토성": "Saturn",
  "천왕성": "Uranus",
  "해왕성": "Neptune",
  "태양": "Sun",
};

router.post("/issue", authMiddleware, async (req, res) => {
  const { purchaseId } = req.body;

  try {
    const purchase = await Purchase.findById(purchaseId).populate("owner");
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });

    const planetEn = planetMap[purchase.planetName] || purchase.planetName;
    const certId = "CERT-" + Date.now();

    const payload = {
      certId,
      ownerUserId: purchase.owner._id,
      ownerName: purchase.buyer,
      planetName: planetEn,
      cellId: purchase.cellId,
      transactionDate: purchase.transactionDate,
      objectId: purchase._id,
      issuedAt: new Date().toISOString(),
    };
    const hash = createHash(payload);

    const qrUrl = "https://celestia.space/verify";
    const qrDataUrl = await QRCode.toDataURL(qrUrl);
    const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margins: { top: 60, bottom: 50, left: 60, right: 60 } });
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

      const cert = new Certificate({
        ownerUserId: purchase.owner._id,
        ownerName: purchase.buyer,
        planetName: planetEn,
        cellId: purchase.cellId,
        transactionDate: purchase.transactionDate,
        objectId: purchase._id,
        hash,
      });
      await cert.save();

      // ✅ 파일명 노출 헤더 추가 (프론트에서 읽기 가능)
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${certId}.pdf"`);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

      res.send(pdfBuffer);
    });

    // 제목
    doc.font("Helvetica-Bold").fontSize(24).text("CELESTIA CERTIFICATE OF OWNERSHIP", { align: "center" });
    doc.moveDown(2);

    // 기본 정보
    const startX = 60;
    let y = 130;
    const gap = 35;

    doc.font("Helvetica").fontSize(14).text("Owner Name:", startX, y);
    doc.font("Helvetica-Bold").text(purchase.buyer, startX + 130, y);
    y += gap;

    doc.font("Helvetica").text("Celestial Object:", startX, y);
    doc.font("Helvetica-Bold").text(planetEn, startX + 130, y);
    y += gap;

    doc.font("Helvetica").text("Cell ID:", startX, y);
    doc.font("Helvetica-Bold").text(purchase.cellId, startX + 130, y);
    y += gap;

    doc.font("Helvetica").text("Transaction Date:", startX, y);
    doc.font("Helvetica-Bold").text(
      new Date(purchase.transactionDate).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      startX + 130,
      y
    );
    y += gap + 10;

    // 행성 이미지 crop
    const planetFileMap = {
      "수성": "mercury",
      "금성": "venus",
      "지구": "earth",
      "화성": "mars",
      "목성": "jupiter",
      "토성": "saturn",
      "천왕성": "uranus",
      "해왕성": "neptune",
      "태양": "sun",
    };

    const planetFileName = planetFileMap[purchase.planetName] || purchase.planetName.toLowerCase();
    const planetImagePath = path.join(__dirname, "../frontend/public/textures", `${planetFileName}.jpg`);

    if (fs.existsSync(planetImagePath)) {
      try {
        const metadata = await sharp(planetImagePath).metadata();
        const gridX = 10;
        const gridY = 10;
        const [cellX, cellY] = purchase.cellId.split("-").map(Number);

        const cellWidth = Math.floor(metadata.width / gridX);
        const cellHeight = Math.floor(metadata.height / gridY);
        const left = cellX * cellWidth;
        const top = cellY * cellHeight;

        const croppedBuffer = await sharp(planetImagePath)
          .extract({ left, top, width: cellWidth, height: cellHeight })
          .resize(320, 160, { fit: "cover" })
          .toBuffer();

        const imageX = doc.page.width - 380;
        const imageY = 160;
        doc.image(croppedBuffer, imageX, imageY, { width: 320, height: 160 });
      } catch (err) {
        console.error("Image crop error:", err);
        doc.font("Helvetica").text("(Image crop failed)", 400, 150);
      }
    }

    // QR 코드
    const qrX = doc.page.width - 300;
    const qrY = 360;
    doc.font("Helvetica").fontSize(12).text("Verification QR Code", qrX, qrY - 20);
    doc.image(qrBuffer, qrX, qrY, { width: 120, height: 120 });

    // 서명
    const signPath = path.join(__dirname, "../frontend/public/textures", "sign.png");
    if (fs.existsSync(signPath)) doc.image(signPath, 400, 500, { width: 150 });
    doc.font("Helvetica").fontSize(10).text("Authorized Signature", 400, 660);

    doc.moveDown(2);
    doc.font("Helvetica").fontSize(9).text(
      "© 2025 CELESTIA SPACE REGISTRY — All Rights Reserved.",
      0,
      770,
      { align: "center" }
    );

    doc.end();
  } catch (err) {
    console.error("❌ Certificate issue error:", err);
    res.status(500).json({ error: "Certificate issue failed" });
  }
});

module.exports = router;
