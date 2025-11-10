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

// 골드/청록 팔레트
const GOLD_DARK = "#7a5b1a";
const GOLD_MID  = "#e8c884";
const GOLD_LIGHT= "#ffe7b0";
const TEAL_D1   = "#0a2630";
const TEAL_D2   = "#0f3b45";

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

// --- [수정된 인증서 발급 라우트] ---
router.post("/issue", authMiddleware, async (req, res) => {
  const { purchaseId } = req.body;

  try {
    const purchase = await Purchase.findById(purchaseId).populate("owner");
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });

    const planetEn = planetMap[purchase.planetName] || purchase.planetName;
    const certId = "CERT-" + Date.now();

    const payload = {
      certId,
      ownerUserId: purchase.owner,
      ownerName: purchase.buyer,
      planetName: planetEn,
      cellId: purchase.cellId,
      transactionDate: purchase.transactionDate,
      objectId: purchase._id,
      issuedAt: new Date().toISOString(),
    };
    const hash = createHash(payload);

    const qrUrl = "https://celestia.space/verify";
    // QR코드를 바로 버퍼로 생성 (원형 마스크 적용 위함)
    const qrBufferRaw = await QRCode.toBuffer(qrUrl, {
      errorCorrectionLevel: "H",
      width: 500,
      color: { dark: "#000000", light: "#FFFFFF00" }, // 투명 배경
    });

    const chunks = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const fontDir = path.join(__dirname, "../fonts");
    try {
      doc.registerFont("ScriptFont", path.join(fontDir, "Parisienne-Regular.ttf"));
      doc.registerFont("SerifItalicFont", path.join(fontDir, "DMSerifText-Italic.ttf"));
    } catch (fontErr) {
      console.error("⚠️ 폰트 로딩 실패! 기본 'Helvetica' 폰트를 사용합니다.", fontErr.message);
      doc.registerFont("ScriptFont", "Helvetica");
      doc.registerFont("SerifItalicFont", "Helvetica-Oblique");
    }

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

      const cert = new Certificate({
        ownerUserId: purchase.owner,
        ownerName: purchase.buyer,
        planetName: planetEn,
        cellId: purchase.cellId,
        transactionDate: purchase.transactionDate,
        objectId: purchase._id,
        hash,
      });
      await cert.save();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${certId}.pdf"`);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.send(pdfBuffer);
    });

    // --- [PDF 디자인 시작] ---

    // 배경 이미지
    const bgPath = path.join(__dirname, "../frontend/public/textures", "space.png");
    if (fs.existsSync(bgPath)) {
      doc.image(bgPath, 0, 0, { width: doc.page.width, height: doc.page.height });
    } else {
      console.error("⚠️ 배경 이미지를 찾을 수 없습니다:", bgPath);
    }

    // 스타일 및 좌표
    const colorLabel = "#AEECEF";
    const colorValue = "#FFFFFF";
    const colorFooter = "#AAAAAA";
    const pagePadding = 80;

    // 제목
    doc.font("ScriptFont")
      .fontSize(36)
      .fillColor(colorValue)
      .text("Celestia Certificate", 0, 80, { align: "center" });

    doc.font("SerifItalicFont")
      .fontSize(16)
      .fillColor(colorLabel)
      .text("OF OWNERSHIP", 0, 125, { align: "center", characterSpacing: 2 });

    // 정보 블록
    const planetRingCenterY = 240;
    const planetRingCenterX = doc.page.width - 150;

    let infoX = pagePadding + 20;
    let infoY = planetRingCenterY - 70;
    const lineGap = 60;

    doc.font("SerifItalicFont").fontSize(14).fillColor(colorLabel).text("Owner Name", infoX, infoY);
    doc.font("ScriptFont").fontSize(28).fillColor(colorValue).text(purchase.buyer, infoX, infoY + 20);
    infoY += lineGap;

    doc.font("SerifItalicFont").fontSize(14).fillColor(colorLabel).text("Celestial Object", infoX, infoY);
    doc.font("SerifItalicFont").fontSize(20).fillColor(colorValue).text(planetEn, infoX, infoY + 20);
    infoY += lineGap;

    doc.font("SerifItalicFont").fontSize(14).fillColor(colorLabel).text("Cell ID", infoX, infoY);
    doc.font("SerifItalicFont").fontSize(20).fillColor(colorValue).text(purchase.cellId, infoX, infoY + 20);
    infoY += lineGap;

    doc.font("SerifItalicFont").fontSize(14).fillColor(colorLabel).text("Transaction Date", infoX, infoY);
    const dateString = new Date(purchase.transactionDate).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.font("SerifItalicFont").fontSize(20).fillColor(colorValue).text(dateString, infoX, infoY + 20);

    // ✅ 행성 조각 이미지 + 액자 프레임
    const planetFileMap = {
      "수성": "mercury", "금성": "venus", "지구": "earth", "화성": "mars",
      "목성": "jupiter", "토성": "saturn", "천왕성": "uranus", "해왕성": "neptune", "태양": "sun",
    };
    const planetFileName = planetFileMap[purchase.planetName] || purchase.planetName.toLowerCase();
    const planetImagePath = path.join(__dirname, "../frontend/public/textures", `${planetFileName}.jpg`);

    const croppedImageWidth = 220;
    const croppedImageHeight = 110;
    const croppedImageX = pagePadding + 20;
    const croppedImageY = infoY + lineGap + 60;

    // ── 액자(매트/프레임) 치수
    const matPad = 16;
    const r = 12;
    const frameX = croppedImageX - matPad;
    const frameY = croppedImageY - matPad;
    const frameW = croppedImageWidth + matPad * 2;
    const frameH = croppedImageHeight + matPad * 2;

    if (fs.existsSync(planetImagePath)) {
      try {
        const metadata = await sharp(planetImagePath).metadata();
        const gridX = 10, gridY = 10;
        const [cellX, cellY] = purchase.cellId.split("-").map(Number);

        const cellWidth = Math.floor(metadata.width / gridX);
        const cellHeight = Math.floor(metadata.height / gridY);
        const left = cellX * cellWidth;
        const top  = cellY * cellHeight;

        const croppedBuffer = await sharp(planetImagePath)
          .extract({ left, top, width: cellWidth, height: cellHeight })
          .resize(croppedImageWidth, croppedImageHeight, { fit: "cover" })
          .toBuffer();

        // ① 드롭 섀도우
        doc.save()
          .roundedRect(frameX + 2, frameY + 3, frameW, frameH, r + 2)
          .fillOpacity(0.25)
          .fillAndStroke("black", null)
          .fillOpacity(1)
          .restore();

        // ② 매트(액자 안쪽 배경) 그라디언트
        const matGrad = doc.linearGradient(frameX, frameY, frameX, frameY + frameH);
        matGrad.stop(0, TEAL_D1).stop(1, TEAL_D2);
        doc.save()
          .roundedRect(frameX, frameY, frameW, frameH, r)
          .fill(matGrad)
          .restore();

        // ③ 콘텐츠 영역 라운드 클리핑 후 이미지 배치
        doc.save()
          .roundedRect(croppedImageX - 2, croppedImageY - 2, croppedImageWidth + 4, croppedImageHeight + 4, r - 4)
          .clip();
        doc.image(croppedBuffer, croppedImageX, croppedImageY, {
          width: croppedImageWidth, height: croppedImageHeight,
        });
        doc.restore();

        // ④ 금속 테두리(바깥)
        const goldStroke = doc.linearGradient(frameX, frameY, frameX + frameW, frameY);
        goldStroke.stop(0, GOLD_DARK).stop(0.5, GOLD_MID).stop(1, GOLD_DARK);
        doc.save()
          .lineWidth(3)
          .roundedRect(frameX, frameY, frameW, frameH, r)
          .stroke(goldStroke)
          .restore();

        // ⑤ 금속 테두리(안쪽 하이라이트)
        doc.save()
          .lineWidth(1)
          .strokeColor(GOLD_LIGHT)
          .roundedRect(frameX + 6, frameY + 6, frameW - 12, frameH - 12, r - 6)
          .stroke()
          .restore();

        // ⑥ 얇은 청록 장식 링
        doc.save()
          .lineWidth(0.8)
          .strokeColor("#4ad1df")
          .roundedRect(frameX + 10, frameY + 10, frameW - 20, frameH - 20, r - 6)
          .stroke()
          .restore();

      } catch (err) {
        console.error("Image crop error:", err);
        doc.font("SerifItalicFont").text("(행성 이미지 로드 실패)", croppedImageX, croppedImageY);
      }
    } else {
      console.error("⚠️ 행성 원본 이미지를 찾을 수 없습니다:", planetImagePath);
      doc.font("SerifItalicFont").text("(행성 이미지 없음)", croppedImageX, croppedImageY);
    }

    // ✅ QR 코드 (원형 마스크 + 중심 오프셋)
    const badgeCenterX = doc.page.width - pagePadding - 50;   // 배지 중심 X
    const badgeCenterY = doc.page.height - pagePadding - 100; // 배지 중심 Y
    const qrRadius = 40;
    const qrDiameter = qrRadius * 2;

    // 원하는 방향으로 미세 이동 (+X: 오른쪽, +Y: 아래)
    const qrOffsetX = 6;
    const qrOffsetY = 4;

    const qrMaskedBuffer = await sharp(qrBufferRaw)
      .resize(qrDiameter, qrDiameter, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .composite([{ input: Buffer.from('<svg><circle cx="50%" cy="50%" r="50%" /></svg>'), operator: "atop" }])
      .png()
      .toBuffer();

    doc.image(
      qrMaskedBuffer,
      badgeCenterX - qrRadius + qrOffsetX,
      badgeCenterY - qrRadius + qrOffsetY,
      { width: qrDiameter, height: qrDiameter }
    );

    // ── 서명 이미지(배경 제거 + 골드 톤) 배치 (B안) — 캡션 제거 & 크기 업
    const signatureRawPath = path.join(
      __dirname,
      "../frontend/public/textures",
      "director_signature.png"
    );
    const signTargetWidth = 210; // ← 살짝 확대
    const signX = pagePadding + 20;
    const signY = croppedImageY + croppedImageHeight + 60;

    if (fs.existsSync(signatureRawPath)) {
      try {
        const resizedBuf = await sharp(signatureRawPath).resize({ width: signTargetWidth }).toBuffer();
        const maskBuf = await sharp(resizedBuf)
          .toColourspace("b-w")
          .gamma(1.6)
          .linear(1.3, -30)
          .threshold(140)
          .blur(0.3)
          .toBuffer();

        const meta = await sharp(resizedBuf).metadata();
        const goldRGBA = { r: 232, g: 200, b: 132, alpha: 1 };

        const signatureGoldPNG = await sharp({
          create: { width: meta.width, height: meta.height, channels: 4, background: goldRGBA },
        })
          .composite([{ input: maskBuf, raw: { width: meta.width, height: meta.height, channels: 1 }, blend: "dest-in" }])
          .png()
          .toBuffer();

        doc.image(signatureGoldPNG, signX, signY, { width: signTargetWidth });
        // (요청대로 캡션 텍스트는 출력하지 않음)
      } catch (e) {
        console.error("Signature process error:", e);
        doc.image(signatureRawPath, signX, signY, { width: signTargetWidth });
      }
    } else {
      console.error("⚠️ 서명 이미지를 찾을 수 없습니다:", signatureRawPath);
      doc.font("ScriptFont").fontSize(22).fillColor(colorValue)
        .text("A. N. Other", signX, signY, { width: signTargetWidth, align: "center" });
      // 캡션도 없음
    }

    // 바닥글
    doc.font("SerifItalicFont")
      .fontSize(9)
      .fillColor(colorFooter)
      .text("© 2025 CELESTIA SPACE REGISTRY — All Rights Reserved.", 0, doc.page.height - 40, { align: "center" });

    doc.end();
  } catch (err) {
    console.error("❌ Certificate issue error:", err);
    res.status(500).json({ error: "Certificate issue failed" });
  }
});

module.exports = router;
