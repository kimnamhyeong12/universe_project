// ======== server.js ========

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const crypto = require("crypto");

// ======== 환경 변수 로드 ========
dotenv.config();

// ======== Express 설정 ========
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173", // 프론트엔드 주소
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======== MongoDB 연결 ========
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch(err => console.error("❌ MongoDB 연결 실패:", err));

// ======== RSA 키 로드 ========
const PRIVATE_KEY_PATH = path.join(__dirname, "keys", "private.pem");
const PUBLIC_KEY_PATH = path.join(__dirname, "keys", "public.pem");

let PRIVATE_KEY = "";
let PUBLIC_KEY = "";

try {
  PRIVATE_KEY = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
  PUBLIC_KEY = fs.readFileSync(PUBLIC_KEY_PATH, "utf8");
  console.log("🔐 RSA 키 로드 완료");
} catch (err) {
  console.warn("⚠️ RSA 키 파일을 찾을 수 없습니다. keys/ 디렉토리를 확인하세요.");
}

// ======== 해시 및 서명 함수 ========
function createHash(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function signData(hash) {
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(hash);
  return signer.sign(PRIVATE_KEY, "base64");
}

// ======== 라우트 불러오기 ========
const { router: authRoutes } = require("./routes/auth");
const planetRoutes = require("./routes/planet");
const universeRoutes = require("./routes/universe");
const galaxyRoutes = require("./routes/galaxy");
const starRoutes = require("./routes/star");
const blackholeRoutes = require("./routes/blackhole");
const certificateRoutes = require("./routes/certificate");
const marketRoutes = require("./routes/market"); // ✅ 마켓 라우트 추가
const purchaseRoutes = require("./routes/purchaseRoutes");
const pixelRoutes = require("./routes/pixelRoutes");
const paymentsRouter = require("./payments/payments.router"); // ✅ 토스 결제 라우터


// ======== 라우트 연결 ========
app.use("/api/auth", authRoutes);
app.use("/api/planets", planetRoutes);
app.use("/api/universes", universeRoutes);
app.use("/api/galaxies", galaxyRoutes);
app.use("/api/stars", starRoutes);
app.use("/api/blackholes", blackholeRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/market", marketRoutes); // ✅ 마켓 라우트 연결
app.use("/api/purchase", purchaseRoutes);
app.use("/api/pixels", pixelRoutes);
app.use("/payments", paymentsRouter); // ✅ 토스 결제 라우터 통합 연결
app.use("/api/payments", paymentsRouter);

// ======== 인증서 및 정적 파일 공개 ========
app.use("/certs", express.static(path.join(__dirname, "certs")));
app.use(express.static(path.join(__dirname, "public")));

// ======== 기본 라우트 ========
app.get("/", (req, res) => {
  res.send("🌍 Universe Project + Luna Embassy Backend Server Running...");
});

// ======== 서버 시작 ========
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
