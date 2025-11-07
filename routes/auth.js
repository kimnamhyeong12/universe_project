const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ==========================
// ✅ 회원가입
// ==========================
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

// ==========================
// ✅ 로그인
// ==========================
router.post("/login", async (req, res) => {
  try {
    console.log("📩 로그인 요청 body:", req.body); // 👈 추가
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log("🔍 찾은 사용자:", user); // 👈 추가
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "2h" }
    );

    res.json({ message: "✅ 로그인 성공", token });
  } catch (err) {
    console.error("로그인 중 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});


// ==========================
// ✅ JWT 인증 미들웨어
// ==========================
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "❌ 인증 실패: 토큰이 없습니다." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");

    req.user = decoded; // 🔥 req.user.id, req.user.username 사용 가능
    next();
  } catch (err) {
    res.status(403).json({ message: "❌ 유효하지 않은 토큰입니다." });
  }
}

// ==========================
// ✅ 프로필 수정 (이름 / 비밀번호 변경)
// ==========================
router.put("/users/:id", verifyToken, async (req, res) => {
  try {
    const { username, password, newPassword } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ 기존 비밀번호 검증
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "현재 비밀번호가 올바르지 않습니다." });

    // ✅ 사용자 이름 변경
    if (username) user.username = username;

    // ✅ 새 비밀번호 변경
    if (newPassword && newPassword.trim() !== "") {
      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
    }

    await user.save();
    res.json({ message: "✅ 프로필이 성공적으로 수정되었습니다." });
  } catch (err) {
    console.error("프로필 수정 오류:", err);
    res.status(500).json({ message: "서버 오류로 인해 업데이트 실패" });
  }
});

// ✅ export
module.exports = { router, verifyToken };
