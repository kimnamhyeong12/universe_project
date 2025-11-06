// middleware/verifyToken.js
const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "인증 토큰이 없습니다." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
    req.user = decoded; // 🔥 여기서 req.user.id 등 사용 가능
    next();
  } catch (err) {
    console.error("❌ JWT 검증 실패:", err);
    res.status(403).json({ message: "유효하지 않은 토큰입니다." });
  }
}

module.exports = verifyToken;
