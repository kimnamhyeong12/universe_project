const express = require("express");
const Payment = require("../models/Payment");
const Planet = require("../models/Planet");
const Star = require("../models/Star");
const Galaxy = require("../models/Galaxy");
const Blackhole = require("../models/Blackhole");
const Certificate = require("../models/Certificate");
const { authMiddleware } = require("../utils/authMiddleware");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const router = express.Router();

// 🧩 해시 생성기
function createHash(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

// ============================
// 1️⃣ 결제 시작 (가상 트랜잭션 생성)
// ============================
router.post("/start", authMiddleware, async (req, res) => {
  try {
    const { assetType, assetId, amount } = req.body;

    const transactionId = "TX-" + Date.now();
    const payment = new Payment({
      user: req.user.id,
      assetType,
      asset: assetId,
      amount,
      transactionId,
      status: "PENDING",
    });

    await payment.save();
    res.json({
      message: "🟡 결제 시뮬레이션 대기 중",
      transactionId,
      paymentId: payment._id,
      note: "이제 /confirm 요청으로 결제 성공 또는 실패를 시뮬레이션할 수 있습니다.",
    });
  } catch (err) {
    console.error("❌ 결제 시작 오류:", err);
    res.status(500).json({ error: "결제 생성 실패" });
  }
});

// ============================
// 2️⃣ 결제 확인 (성공 or 실패)
// ============================
router.post("/confirm", authMiddleware, async (req, res) => {
  try {
    const { transactionId, success } = req.body;
    const payment = await Payment.findOne({ transactionId }).populate("asset");

    if (!payment) return res.status(404).json({ error: "해당 결제 내역이 없습니다." });
    if (payment.status !== "PENDING")
      return res.status(400).json({ error: "이미 처리된 결제입니다." });

    // 결제 결과
    if (success) {
      payment.status = "SUCCESS";
      payment.confirmedAt = new Date();

      // 🪐 소유권 이전 (행성/별/갤럭시/블랙홀)
      const Model = require(`../models/${payment.assetType}`);
      await Model.findByIdAndUpdate(payment.asset, {
        owner: req.user.id,
        isForSale: false,
      });

      // 📜 인증서 자동 발급
      const certId = "CERT-" + Date.now();
      const payload = {
        certId,
        ownerUserId: req.user.id,
        ownerName: req.user.username,
        assetType: payment.assetType,
        assetId: payment.asset,
        issuedAt: new Date().toISOString(),
      };

      const hash = createHash(payload);
      const certDir = path.join(__dirname, "../certs");
      fs.mkdirSync(certDir, { recursive: true });
      const certPath = path.join(certDir, `${certId}.pdf`);

      // PDF 생성 (간단 버전)
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(certPath));
      doc.fontSize(22).text("🌌 CELESTIA CERTIFICATE", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Certificate ID: ${certId}`);
      doc.text(`Owner: ${req.user.username}`);
      doc.text(`Asset Type: ${payment.assetType}`);
      doc.text(`Asset ID: ${payment.asset}`);
      doc.text(`Issued: ${new Date().toLocaleString()}`);
      doc.text(`Hash (SHA256): ${hash}`);
      doc.end();

      const certificate = new Certificate({
        ...payload,
        hash,
        pdfPath: certPath,
      });
      await certificate.save();

      await payment.save();

      res.json({
        message: "✅ 결제 성공 (시뮬레이션)",
        transactionId,
        paymentStatus: payment.status,
        certId,
        certPath: `/certs/${certId}.pdf`,
      });
    } else {
      payment.status = "FAILED";
      await payment.save();
      res.json({ message: "❌ 결제 실패 (시뮬레이션)", transactionId });
    }
  } catch (err) {
    console.error("❌ 결제 확인 오류:", err);
    res.status(500).json({ error: "결제 처리 실패" });
  }
});

// ============================
// 3️⃣ 결제 상태 조회
// ============================
router.get("/status/:txId", authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findOne({ transactionId: req.params.txId })
      .populate("user")
      .populate("asset");

    if (!payment) return res.status(404).json({ error: "결제 내역 없음" });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: "상태 조회 실패" });
  }
});

// ============================
// 4️⃣ 환불 시뮬레이션
// ============================
router.post("/refund", authMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const payment = await Payment.findOne({ transactionId });

    if (!payment) return res.status(404).json({ error: "결제 내역 없음" });
    if (payment.status !== "SUCCESS")
      return res.status(400).json({ error: "성공한 결제만 환불 가능" });

    payment.status = "REFUNDED";
    await payment.save();

    res.json({ message: "💸 환불 완료 (시뮬레이션)", transactionId });
  } catch (err) {
    res.status(500).json({ error: "환불 실패" });
  }
});

module.exports = router;
