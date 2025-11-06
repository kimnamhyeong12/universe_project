const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// 회원가입
router.post("/register", async (req, res) => {
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

// 로그인
router.post("/login", async (req, res) => {
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

// ✅ [추가] JWT 인증 미들웨어
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "❌ 인증 실패: 토큰이 없습니다." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");

    req.user = decoded; // 🔥 이제 req.user.id, req.user.username 사용 가능
    next();
  } catch (err) {
    res.status(403).json({ message: "❌ 유효하지 않은 토큰입니다." });
  }
}

// ✅ export 추가
module.exports = { router, verifyToken };
