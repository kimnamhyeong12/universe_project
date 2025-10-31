// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const crypto = require("crypto");

// ======== 환경 변수 로드 ========
dotenv.config();

// ======== Express 설정 ========
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======== MongoDB 연결 ========
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/universe_project", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));

// ======== 스키마 정의 ========

// 사용자
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

// 행성
const planetSchema = new mongoose.Schema({
  name: String,
  description: String,
  imageUrl: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  price: Number,
  isForSale: Boolean,
});

// 인증서
const certSchema = new mongoose.Schema({
  certId: String,
  ownerUserId: String,
  ownerName: String,
  assetType: String,
  assetId: String,
  issuedAt: Date,
  hash: String,
  signature: String,
  pdfPath: String,
});

// 모델 등록
const User = mongoose.model("User", userSchema);
const Planet = mongoose.model("Planet", planetSchema);
const Certificate = mongoose.model("Certificate", certSchema);

// ======== JWT 미들웨어 ========
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ======== 회원가입 ========
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashed });
    await user.save();
    res.json({ message: "✅ 회원가입 성공" });
  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
});

// ======== 로그인 ========
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    process.env.JWT_SECRET || "SECRET_KEY",
    { expiresIn: "2h" }
  );

  res.json({ message: "✅ 로그인 성공", token });
});

// ======== 행성 등록 ========
app.post("/api/planets/create", authMiddleware, async (req, res) => {
  const { name, description, imageUrl, price } = req.body;
  const planet = new Planet({
    name,
    description,
    imageUrl,
    price,
    isForSale: true,
    owner: req.user.id,
  });
  await planet.save();
  res.status(201).json({ message: "✅ 행성 등록 완료" });
});

// ======== 모든 행성 조회 ========
app.get("/api/planets", async (req, res) => {
  const planets = await Planet.find().populate("owner", "username");
  res.json(planets);
});

// ======== RSA 키 로드 ========
const PRIVATE_KEY_PATH = path.join(__dirname, "keys", "private.pem");
const PUBLIC_KEY_PATH = path.join(__dirname, "keys", "public.pem");

let PRIVATE_KEY = "";
let PUBLIC_KEY = "";

try {
  PRIVATE_KEY = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
  PUBLIC_KEY = fs.readFileSync(PUBLIC_KEY_PATH, "utf8");
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

// ======== 인증서 발급 ========
app.post("/api/certificates/issue", authMiddleware, async (req, res) => {
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
  const signature = PRIVATE_KEY ? signData(hash) : "NO_SIGNATURE";
  const verifyUrl = `https://yourdomain.com/verify/${certId}`;
  const qr = await QRCode.toDataURL(verifyUrl);

  // PDF 생성
  const certDir = path.join(__dirname, "certs");
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
  doc.moveDown();
  doc.text(`Signature: ${signature.substring(0, 100)}...`);
  const qrBuffer = Buffer.from(qr.split(",")[1], "base64");
  doc.image(qrBuffer, { fit: [100, 100], align: "right" });
  doc.end();

  // DB 저장
  const cert = new Certificate({
    certId,
    ownerUserId: req.user.id,
    ownerName: req.user.username,
    assetType,
    assetId,
    issuedAt: new Date(),
    hash,
    signature,
    pdfPath: certPath,
  });
  await cert.save();

  res.json({
    message: "✅ Certificate issued",
    certId,
    pdfUrl: `/certs/${certId}.pdf`,
  });
});

// ======== 인증서 파일 공개 ========
app.use("/certs", express.static(path.join(__dirname, "certs")));

// ======== 프론트엔드 정적 파일 (예: public 폴더) ========
app.use(express.static(path.join(__dirname, "public")));

// ======== 기본 라우트 ========
app.get("/", (req, res) => {
  res.send("🌍 Universe Project + Luna Embassy Backend Server Running...");
});

// ======== 서버 시작 ========
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
