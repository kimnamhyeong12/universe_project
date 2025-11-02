// 📁 scripts/seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// 🌌 모델 로딩
const User = require("../models/User");
const Planet = require("../models/Planet");
const Star = require("../models/Star");
const Galaxy = require("../models/Galaxy");
const Blackhole = require("../models/Blackhole");

// 🌱 환경 변수 설정
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패:", err);
    process.exit(1);
  });

async function seedData() {
  try {
    console.log("🌱 Seed 데이터 삽입 시작");

    // 👤 테스트 유저 하나 생성 (존재 시 생략)
    let user = await User.findOne({ email: "test@test.com" });
    if (!user) {
      user = new User({
        username: "testuser",
        email: "test@test.com",
        password: "hashedpw", // 실제 로그인은 안 됨, seed용
      });
      await user.save();
    }
    const ownerId = user._id;

    // 기존 데이터 초기화
    await Planet.deleteMany();
    await Star.deleteMany();
    await Galaxy.deleteMany();
    await Blackhole.deleteMany();

    // 🪐 행성 데이터 (임시 텍스처 사용)
    const planets = [
      { name: "테스트 행성 1", imageUrl: "/textures/planet_default.jpg" },
      { name: "테스트 행성 2", imageUrl: "/textures/planet_default.jpg" },
      { name: "테스트 행성 3", imageUrl: "/textures/planet_default.jpg" },
    ].map((p) => ({
      ...p,
      description: `${p.name}은 임시로 생성된 행성입니다.`,
      price: 1000,
      isForSale: true,
      owner: ownerId,
    }));

    // ⭐ 항성 (태양)
    const stars = [
      {
        name: "태양",
        type: "G형 주계열성",
        mass: 1.989e30,
        radius: 696340,
        temperature: 5778,
        description: "우리 태양계의 중심별",
        imageUrl: "/textures/star.jpg",
        isForSale: false,
        owner: ownerId,
        galaxy: null,
      },
    ];

    // 🌌 은하
    const galaxies = [
      {
        name: "안드로메다",
        description: "가장 가까운 대형 은하",
        imageUrl: "/textures/galaxy.png",
        isForSale: true,
        owner: ownerId,
      },
    ];

    // 🕳️ 블랙홀
    const blackholes = [
      {
        name: "궁수자리 A*",
        description: "우리 은하 중심에 있는 초대질량 블랙홀",
        imageUrl: "/textures/blackhole.mp4",
        isForSale: true,
        owner: ownerId,
      },
    ];

    // ✅ 데이터 저장
    await Planet.insertMany(planets);
    const savedGalaxies = await Galaxy.insertMany(galaxies);
    stars[0].galaxy = savedGalaxies[0]._id;
    await Star.insertMany(stars);
    await Blackhole.insertMany(blackholes);

    console.log("✅ Seed 데이터 삽입 완료");
  } catch (err) {
    console.error("❌ Seed 중 오류:", err);
  } finally {
    mongoose.disconnect();
  }
}

seedData();
