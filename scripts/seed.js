const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

const User = require("../models/User");
const Galaxy = require("../models/Galaxy");
const Star = require("../models/Star");
const Planet = require("../models/Planet");
const Blackhole = require("../models/Blackhole");

// 🌱 환경 변수 로딩
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch(err => {
    console.error("❌ 연결 실패:", err);
    process.exit(1);
  });

async function seedData() {
  try {
    console.log("🌱 Seed 데이터 삽입 시작");

    // 기존 데이터 삭제
    await Promise.all([
      Galaxy.deleteMany(),
      Star.deleteMany(),
      Planet.deleteMany(),
      Blackhole.deleteMany(),
    ]);

    // 테스트 유저 생성
    let user = await User.findOne({ email: "test@test.com" });
    if (!user) {
      user = await User.create({
        username: "testuser",
        email: "test@test.com",
        password: "hashedpw", // 실제 비밀번호 아님
      });
    }

    const ownerId = user._id;

    // 🌌 은하 생성
    const galaxy = await Galaxy.create({
      name: "안드로메다",
      description: "가장 가까운 대형 은하",
      imageUrl: "/textures/galaxy.png",
      position: { x: 10, y: 0, z: 20 },
      isForSale: false,
      owner: ownerId,
    });

    // ⭐ 항성 생성
    const star = await Star.create({
      name: "태양",
      type: "G형 주계열성",
      mass: 1.989e30,
      diameter: 1392684,
      temperature: 5778,
      description: "우리 태양계의 중심별",
      imageUrl: "/textures/sun.jpg",
      position: { x: 0, y: 0, z: 0 },
      galaxy: galaxy._id,
      isForSale: true,
      owner: ownerId,
      price: 500000000,
    });

    // 🪐 태양계 8개 행성 생성
    const planets = [
      {
      name: "수성",
      description: "태양에서 가장 가까운 행성",
      imageUrl: "/textures/mercury.jpg",
      orbitRadius: 10,
      orbitSpeed: 0.015,
      price: 5000,
      // --- ⬇️ 추가 ⬇️ ---
      diameter: 4879,
      mass: 0.330,
      temperature: 167,
    },
    {
      name: "금성",
      description: "두 번째 행성, 두꺼운 대기",
      imageUrl: "/textures/venus.jpg",
      orbitRadius: 14,
      orbitSpeed: 0.012,
      price: 7000,
      // --- ⬇️ 추가 ⬇️ ---
      diameter: 12104,
      mass: 4.87,
      temperature: 464,
    },
    {
      name: "지구",
      description: "우리가 사는 행성",
      imageUrl: "/textures/earth.jpg",
      orbitRadius: 18,
      orbitSpeed: 0.01,
      price: 9000,
      // --- ⬇️ 추가 ⬇️ ---
      diameter: 12742,
      mass: 5.97,
      temperature: 15,
    },
    {
      name: "화성",
      description: "붉은 행성",
      imageUrl: "/textures/mars.jpg",
      orbitRadius: 22,
      orbitSpeed: 0.008,
      price: 11000,
      // --- ⬇️ 추가 ⬇️ ---
      diameter: 6779,
      mass: 0.642,
      temperature: -65,
    },
    {
      name: "목성",
      description: "가장 큰 행성",
      imageUrl: "/textures/jupiter.jpg",
      orbitRadius: 28,
      orbitSpeed: 0.006,
      price: 14000,
      // --- ⬇️ 추가 ⬇️ ---
      diameter: 139820,
      mass: 1898,
      temperature: -110,
    },
    {
      name: "토성",
      description: "아름다운 고리의 행성",
      imageUrl: "/textures/saturn.jpg",
      orbitRadius: 34,
      orbitSpeed: 0.005,
      price: 17000,
      // --- ⬇️ 추가 ⬇️ ---
      diameter: 116460,
      mass: 568,
      temperature: -140,
    },
    {
      name: "천왕성",
      description: "푸른 얼음 거인",
      imageUrl: "/textures/uranus.jpg",
      orbitRadius: 40,
      orbitSpeed: 0.004,
      price: 20000,
      // --- ⬇️ 추가 ⬇️ ---
      diameter: 50724,
      mass: 86.8,
      temperature: -195,
    },
    {
      name: "해왕성",
      description: "가장 멀리 있는 행성",
      imageUrl: "/textures/neptune.jpg",
      orbitRadius: 46,
      orbitSpeed: 0.0035,
      price: 23000,
      // --- ⬇️ 추가 ⬇️ ---
      diameter: 49244,
      mass: 102,
      temperature: -200,
    }
    ].map(p => ({
      ...p,
      galaxy: galaxy._id,
      star: star._id,
      isForSale: true,
      // price: 1000,
      owner: ownerId,
    }));

    await Planet.insertMany(planets);

    // 🕳️ 블랙홀 생성
    await Blackhole.create({
      name: "궁수자리 A*",
      description: "우리 은하 중심에 있는 초대질량 블랙홀",
      imageUrl: "/textures/blackhole.mp4",
      galaxy: galaxy._id,
      position: { x: 30, y: 10, z: -10 },
      isForSale: false,
      price: 5000,
      owner: ownerId,
    });

    console.log("✅ Seed 데이터 삽입 완료 (태양계 8행성 + 태양 + 은하 + 블랙홀)");
  } catch (err) {
    console.error("❌ Seed 중 오류:", err);
  } finally {
    mongoose.disconnect();
  }
}

seedData();
