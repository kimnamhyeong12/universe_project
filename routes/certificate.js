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
    // QR코드를 바로 버퍼로 생성 (나중에 원형 마스크 적용을 위해)
    const qrBufferRaw = await QRCode.toBuffer(qrUrl, {
      errorCorrectionLevel: 'H', // 높은 오류 수정 레벨
      width: 500, // 큰 이미지로 생성 후 리사이즈 및 마스크 적용
      color: { dark: '#000000', light: '#FFFFFF00' } // 투명 배경으로 생성
    });

    const chunks = [];
    
    const doc = new PDFDocument({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });

    const fontDir = path.join(__dirname, "../fonts");
    try {
        doc.registerFont('ScriptFont', path.join(fontDir, 'Parisienne-Regular.ttf'));
        doc.registerFont('SerifItalicFont', path.join(fontDir, 'DMSerifText-Italic.ttf'));
    } catch (fontErr) {
        console.error("⚠️ 폰트 로딩 실패! 기본 'Helvetica' 폰트를 사용합니다.", fontErr.message);
        doc.registerFont('ScriptFont', 'Helvetica');
        doc.registerFont('SerifItalicFont', 'Helvetica-Oblique');
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

    // 배경 이미지 그리기
    const bgPath = path.join(__dirname, "../frontend/public/textures", "space.png");
    if (fs.existsSync(bgPath)) {
      doc.image(bgPath, 0, 0, { width: doc.page.width, height: doc.page.height });
    } else {
      console.error("⚠️ 배경 이미지를 찾을 수 없습니다:", bgPath);
    }

    // 스타일 및 좌표 정의
    const colorLabel = "#AEECEF";
    const colorValue = "#FFFFFF";
    const colorFooter = "#AAAAAA";
    const pagePadding = 80;

    // 제목 (손글씨체 적용)
    doc.font('ScriptFont')
       .fontSize(36)
       .fillColor(colorValue)
       .text("Celestia Certificate", 0, 80, { align: "center" });
    
    doc.font('SerifItalicFont')
       .fontSize(16)
       .fillColor(colorLabel)
       .text("OF OWNERSHIP", 0, 125, { align: "center", characterSpacing: 2 });
    
    // ✅ 1, 2. 정보 블록 위치 및 글자 크기 조정
    // 오른쪽 상단 행성의 대략적인 중심 Y 위치를 기준으로 infoY 조정
    const planetRingCenterY = 240; // 배경 행성 고리의 대략적인 중심 Y좌표 (조정 가능)
    const planetRingCenterX = doc.page.width - 150; // 배경 행성 고리의 대략적인 중심 X좌표

    let infoX = pagePadding + 20; // 왼쪽 여백 살짝 더 추가
    let infoY = planetRingCenterY - 70; // ◀️ 정보 블록 시작 Y좌표를 행성 고리에 맞게 조정
    const lineGap = 60;      // ◀️ 항목 간 세로 간격 살짝 늘림
    
    // --- Owner Name ---
    doc.font('SerifItalicFont').fontSize(14).fillColor(colorLabel).text("Owner Name", infoX, infoY); // ◀️ 크기 키움
    doc.font('ScriptFont')
       .fontSize(28)      // ◀️ 크기 키움
       .fillColor(colorValue)
       .text(purchase.buyer, infoX, infoY + 20); // ◀️ 간격 조정
    infoY += lineGap;
    
    // --- Celestial Object ---
    doc.font('SerifItalicFont').fontSize(14).fillColor(colorLabel).text("Celestial Object", infoX, infoY); // ◀️ 크기 키움
    doc.font('SerifItalicFont')
       .fontSize(20)      // ◀️ 크기 키움
       .fillColor(colorValue)
       .text(planetEn, infoX, infoY + 20); // ◀️ 간격 조정
    infoY += lineGap;
    
    // --- Cell ID ---
    doc.font('SerifItalicFont').fontSize(14).fillColor(colorLabel).text("Cell ID", infoX, infoY); // ◀️ 크기 키움
    doc.font('SerifItalicFont')
       .fontSize(20)      // ◀️ 크기 키움
       .fillColor(colorValue)
       .text(purchase.cellId, infoX, infoY + 20); // ◀️ 간격 조정
    infoY += lineGap;

    // --- Transaction Date ---
    doc.font('SerifItalicFont').fontSize(14).fillColor(colorLabel).text("Transaction Date", infoX, infoY); // ◀️ 크기 키움
    const dateString = new Date(purchase.transactionDate).toLocaleString("en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
    doc.font('SerifItalicFont')
       .fontSize(20)      // ◀️ 크기 키움
       .fillColor(colorValue)
       .text(dateString, infoX, infoY + 20); // ◀️ 간격 조정
    // infoY는 여기서 더 이상 증가시키지 않고, 행성 이미지 Y좌표로 바로 넘어갑니다.


    // ✅ 3. 행성 조각 이미지 이동 및 크기 확대 (왼쪽, 서명 위)
    const planetFileMap = {
        "수성": "mercury", "금성": "venus", "지구": "earth", "화성": "mars", 
        "목성": "jupiter", "토성": "saturn", "천왕성": "uranus", "해왕성": "neptune", "태양": "sun",
    };
    const planetFileName = planetFileMap[purchase.planetName] || purchase.planetName.toLowerCase();
    const planetImagePath = path.join(__dirname, "../frontend/public/textures", `${planetFileName}.jpg`);

    const croppedImageWidth = 220; // ◀️ 크롭된 이미지 너비 확대
    const croppedImageHeight = 110; // ◀️ 크롭된 이미지 높이 확대
    const croppedImageX = pagePadding + 20; // ◀️ 왼쪽 패딩 + 약간의 여백
    const croppedImageY = infoY + lineGap + 60; // ◀️ 날짜 블록 아래, 서명 블록 위
    
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
                .resize(croppedImageWidth, croppedImageHeight, { fit: "cover" })
                .toBuffer();

            doc.image(croppedBuffer, croppedImageX, croppedImageY, { width: croppedImageWidth, height: croppedImageHeight });
        } catch (err) {
            console.error("Image crop error:", err);
            doc.font("SerifItalicFont").text("(행성 이미지 로드 실패)", croppedImageX, croppedImageY);
        }
    } else {
        console.error("⚠️ 행성 원본 이미지를 찾을 수 없습니다:", planetImagePath);
        doc.font("SerifItalicFont").text("(행성 이미지 없음)", croppedImageX, croppedImageY);
    }
    
    // ✅ 4. QR 코드 뱃지 안에 동그란 형태로 삽입
    const badgeCenterX = doc.page.width - pagePadding - 50; // 노란 뱃지의 대략적인 중심 X
    const badgeCenterY = doc.page.height - pagePadding - 100; // 노란 뱃지의 대략적인 중심 Y
    const qrRadius = 40; // QR 코드의 절반 크기 (뱃지 크기에 맞게 조정)
    const qrDiameter = qrRadius * 2;

    // QR 코드 원형 마스크 적용
    const qrMaskedBuffer = await sharp(qrBufferRaw)
        .resize(qrDiameter, qrDiameter, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }) // 투명 배경
        .composite([{
            input: Buffer.from('<svg><circle cx="50%" cy="50%" r="50%" /></svg>'),
            operator: 'atop'
        }])
        .png()
        .toBuffer();

    doc.image(qrMaskedBuffer, badgeCenterX - qrRadius, badgeCenterY - qrRadius, { width: qrDiameter, height: qrDiameter });


    // 서명 위치 조정 (행성 이미지와 QR 코드 위치에 맞춰)
    const signPath = path.join(__dirname, "../frontend/public/textures", "sign.png");
    const signWidth = 150;
    const signX = pagePadding + 20; // ◀️ 왼쪽 여백
    const signY = croppedImageY + croppedImageHeight + 60; // ◀️ 행성 이미지 아래에 여백 추가
    
    if (fs.existsSync(signPath)) {
      doc.image(signPath, signX, signY, { width: signWidth });
    } else {
      console.error("⚠️ 서명 이미지를 찾을 수 없습니다:", signPath);
      doc.font('ScriptFont')
         .fontSize(22)
         .fillColor(colorValue)
         .text("A. N. Other", signX, signY, { width: signWidth, align: 'center' }); // 임시 텍스트 서명
    }
    
    doc.font('SerifItalicFont')
       .fontSize(10)
       .fillColor(colorLabel)
       .text("Authorized Signature", signX, signY + 60, {
         width: signWidth,
         align: 'center'
       });

    // 바닥글 (Footer)
    doc.font('SerifItalicFont')
       .fontSize(9)
       .fillColor(colorFooter)
       .text(
         "© 2025 CELESTIA SPACE REGISTRY — All Rights Reserved.",
         0,
         doc.page.height - 40,
         { align: "center" }
       );
    
    doc.end();

  } catch (err) {
    console.error("❌ Certificate issue error:", err);
    res.status(500).json({ error: "Certificate issue failed" });
  }
});

module.exports = router;