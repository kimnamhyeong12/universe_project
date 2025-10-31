// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const planetRoutes = require('./routes/planet');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/planets', planetRoutes);

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB 연결 성공');
  app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
})
.catch(err => console.error('❌ MongoDB 연결 실패:', err));
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

// ======== MongoDB 연결 ========
mongoose
  .connect("mongodb://localhost:27017/luna_embassy")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error(err));

// ======== 스키마 정의 ========
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

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

const User = mongoose.model("User", userSchema);
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
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: "Email already exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashed });
  await user.save();
  res.json({ message: "✅ User registered successfully" });
});

// ======== 로그인 ========
app.post("/login", async (req, res) => {
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

  res.json({ message: "✅ Login success", token });
});

// ======== RSA 키 로드 ========
const PRIVATE_KEY = fs.readFileSync("./keys/private.pem", "utf8");
const PUBLIC_KEY = fs.readFileSync("./keys/public.pem", "utf8");

// ======== 해시 및 서명 함수 ========
function createHash(payload) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

function signData(hash) {
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(hash);
  return signer.sign(PRIVATE_KEY, "base64");
}

// ======== 인증서 발급 (로그인 필요) ========
app.post("/issue", authMiddleware, async (req, res) => {
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
  const signature = signData(hash);
  const verifyUrl = `https://yourdomain.com/verify/${certId}`;
  const qr = await QRCode.toDataURL(verifyUrl);

  // PDF 생성
  const certPath = path.join("certs", `${certId}.pdf`);
  fs.mkdirSync("certs", { recursive: true });
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(certPath));

  doc
    .fontSize(20)
    .text("LUNA EMBASSY - Certificate of Ownership", { align: "center" });
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

// ======== 인증서 폴더 공개 ========
app.use("/certs", express.static(path.join(process.cwd(), "certs")));

// ======== 서버 실행 ========

// 루트 페이지 접속 시 로그인 페이지로 이동
app.get("/", (req, res) => {
  res.redirect("/login.html");
});
app.get("/", (req, res) => res.redirect("/register.html"));


app.listen(3000, () =>
  console.log("🚀 Server running on http://localhost:3000")
);

app.use(express.static("public"));
