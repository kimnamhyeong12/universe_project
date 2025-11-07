// ======== payments/server.js ========

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const router = require("./payments.router");

// ======== 환경 변수 로드 ========
dotenv.config();

// ======== Express 설정 ========
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: "http://localhost:5173",
}));

// ======== 결제 라우트 등록 ========
app.use("/sandbox-dev/api/v1/payments", router);

// ======== 서버 시작 ========
app.listen(4242, () => console.log("💳 Toss Sandbox Server is Listening on port 4242..."));
