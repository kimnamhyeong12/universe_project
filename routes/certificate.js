const express = require("express");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const crypto = require("crypto");
const Certificate = require("../models/Certificate");
const { authMiddleware } = require("../utils/authMiddleware");

const router = express.Router();

// 해시 함수
function createHash(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

// 인증서 발급
router.post("/issue", authMiddleware, async (req, res) => {
  const { assetType, assetId } = req.body;
  const certId = "CERT-" + Date.now();
  const payload = {
    certId,
    ownerUserId: req.user.id,
    ownerName: req.user.username,
    assetType,
    assetId,
    issuedAt: new Date().toISOString(),
  };

  const hash = createHash(payload);
  const verifyUrl = `https://yourdomain.com/verify/${certId}`;
  const qr = await QRCode.toDataURL(verifyUrl);

  const certDir = path.join(__dirname, "../certs");
  const certPath = path.join(certDir, `${certId}.pdf`);
  fs.mkdirSync(certDir, { recursive: true });

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(certPath));
  doc.fontSize(20).text("🌙 LUNA EMBASSY - Certificate of Ownership", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Certificate ID: ${certId}`);
  doc.text(`Owner: ${req.user.username}`);
  doc.text(`Asset: ${assetType} / ${assetId}`);
  doc.text(`Issued: ${payload.issuedAt}`);
  doc.moveDown();
  doc.text(`Hash (SHA256): ${hash}`);
  const qrBuffer = Buffer.from(qr.split(",")[1], "base64");
  doc.image(qrBuffer, { fit: [100, 100], align: "right" });
  doc.end();

  const cert = new Certificate({
    ...payload,
    hash,
    pdfPath: certPath,
  });
  await cert.save();

  res.json({ message: "✅ Certificate issued", certId, pdfUrl: `/certs/${certId}.pdf` });
});

module.exports = router;
