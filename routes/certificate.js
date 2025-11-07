const express = require("express");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const crypto = require("crypto");
const Certificate = require("../models/Certificate");
const { authMiddleware } = require("../utils/authMiddleware");

const router = express.Router();

// 🔐 SHA256 해시 함수
function createHash(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

// ====================================================
// 📜 인증서 발급 (CELESTIA SMALLINFO 스타일)
// ====================================================
router.post("/issue", authMiddleware, async (req, res) => {
  const { assetType, assetId } = req.body;

  try {
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
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);

    // 📂 PDF 저장 경로
    const certDir = path.join(__dirname, "../certs");
    fs.mkdirSync(certDir, { recursive: true });
    const certPath = path.join(certDir, `${certId}.pdf`);

    // 🪶 A4 PDF 초기화
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });
    doc.pipe(fs.createWriteStream(certPath));

    // 배경색
    doc.rect(0, 0, doc.page.width, doc.page.height)
       .fill("#FAF5E6");

    // 테두리
    doc.lineWidth(6)
       .strokeColor("#645042")
       .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .stroke();

    // 제목
    doc.fillColor("#282828")
       .font("Times-Bold")
       .fontSize(48)
       .text("CELESTIA", { align: "center", lineGap: 10 });
    doc.moveDown(1);

    // 오른쪽 이미지/QR 영역
    const rightX = doc.page.width - 260;
    const topY = 150;

    // Planet Image
    doc.lineWidth(1.5)
       .strokeColor("#88705A")
       .rect(rightX - 180, topY, 180, 180)
       .stroke();
    doc.font("Times-Roman").fontSize(10).fillColor("#666")
       .text("Planet Image", rightX - 140, topY + 190, { width: 180, align: "center" });

    // QR 코드
    const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
    const qrY = topY + 260;
    doc.image(qrBuffer, rightX - 150, qrY, { fit: [130, 130], align: "center" });
    doc.fontSize(10).text("QR Code", rightX - 140, qrY + 140, { width: 180, align: "center" });

    // 본문 설명
    const bodyText = `Within the CELESTIA registry, each celestial object is uniquely recorded and conserved. This document attests to ownership in the grand expanse of interstellar space, recognized by the CELESTIA authority and preserved in our cosmic archive.`;
    doc.moveDown(1);
    doc.font("Times-Roman").fontSize(14).fillColor("#2D2D2D")
       .text(bodyText, 80, 220, { width: 330, align: "left" });

    // 하단 정보 (작은 폰트)
    const startY = doc.page.height - 340;
    const fields = [
      ["Celestial Object", assetId || "N/A"],
      ["Owner Name", req.user.username],
      ["Certificate ID", certId],
      ["Issued Date", new Date().toLocaleDateString()],
    ];

    let y = startY;
    for (const [label, value] of fields) {
      doc.font("Times-Roman").fontSize(11).fillColor("#4A3C2C").text(`${label}:`, 100, y);
      doc.font("Times-Bold").fontSize(13).fillColor("#222").text(value, 240, y);
      y += 25;
    }

    // 서명 영역
    const lineY = doc.page.height - 120;
    doc.moveTo(80, lineY).lineTo(doc.page.width - 80, lineY).stroke("#705A42");
    doc.font("Times-Italic").fontSize(12).fillColor("#444").text("Signed by", 100, lineY + 10);
    doc.font("Times-BoldItalic").fontSize(16).fillColor("#2E3D6F")
       .text("CELESTIA AUTHORITY", 100, lineY + 30);

    // 인장(Seal)
    doc.circle(doc.page.width - 140, doc.page.height - 100, 40)
       .lineWidth(3)
       .strokeColor("#E6BE3E")
       .stroke();
    doc.font("Times-Bold").fontSize(10).fillColor("#E6BE3E")
       .text("CELESTIA", doc.page.width - 170, doc.page.height - 110, { width: 60, align: "center" });

    doc.end();

    // DB에 인증서 정보 저장
    const cert = new Certificate({
      ...payload,
      hash,
      pdfPath: certPath,
    });
    await cert.save();

    res.json({
      message: "✅ CELESTIA Certificate issued",
      certId,
      pdfUrl: `/certs/${certId}.pdf`,
    });
  } catch (err) {
    console.error("❌ Certificate issue error:", err);
    res.status(500).json({ error: "Failed to issue certificate" });
  }
});

module.exports = router;
