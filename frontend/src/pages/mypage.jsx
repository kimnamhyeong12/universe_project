// src/pages/mypage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/celestia-styles.css";

export default function MyPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]); // 구매 목록
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ✅ 행성 이름 → 이미지 매핑
  const planetImages = {
    수성: "/textures/mercury.jpg",
    금성: "/textures/venus.jpg",
    지구: "/textures/earth.jpg",
    화성: "/textures/mars.jpg",
    목성: "/textures/jupiter.jpg",
    토성: "/textures/saturn.jpg",
    천왕성: "/textures/uranus.jpg",
    해왕성: "/textures/neptune.jpg",
    태양: "/textures/sun.jpg",
  };

  // ✅ 내 구매 내역 불러오기
  useEffect(() => {
    if (!user || !user.id) return;

    async function fetchPurchases() {
      try {
        const token =
          localStorage.getItem("celestia_token") || localStorage.getItem("jwt");
        if (!token) {
          console.warn("❌ 토큰이 없습니다.");
          return;
        }

        const res = await fetch(
          `http://localhost:5000/api/purchase/user/${user.id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("구매 내역 불러오기 실패");
        const data = await res.json();
        setPurchases(data);
      } catch (err) {
        console.error("❌ 구매 내역 불러오기 오류:", err);
      }
    }

    fetchPurchases();
  }, [user]);

  // ✅ 행성별로 그룹화
  const grouped = purchases.reduce((acc, p) => {
    if (!acc[p.planetName]) acc[p.planetName] = [];
    acc[p.planetName].push(p);
    return acc;
  }, {});

  // ✅ 모달 내부 (행성 구역 썸네일)
  const gridSizeX = 10; // 가로 10칸
  const gridSizeY = 5; // 세로 5칸

  const renderPlanetModal = (planetName) => {
    const cells = grouped[planetName] || [];
    const imgSrc = planetImages[planetName] || "/textures/planet_default.jpg";

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="card-glass w-[720px] p-6 relative">
          <div className="text-2xl font-bold mb-4">{planetName} 구역 목록</div>

          <div className="grid grid-cols-3 gap-4">
            {cells.map((cell) => {
              const [x, y] = cell.cellId.split("-").map(Number);
              const bgSize = `${gridSizeX * 100}% ${gridSizeY * 100}%`;

              return (
                <Link
                  key={cell._id}
                  to={`/pixel/${planetName}/${cell.cellId}`}
                  className="rounded-lg overflow-hidden border border-cyan-400/40 hover:scale-105 transition relative"
                >
                  <div
                    className="w-full h-24 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${imgSrc})`,
                      backgroundSize: bgSize,
                      backgroundPosition: `${(x / (gridSizeX - 1)) * 100}% ${
                        (y / (gridSizeY - 1)) * 100
                      }%`,
                      filter: "brightness(1.4) contrast(1.1)",
                    }}
                  />
                  <div className="absolute bottom-1 right-2 text-xs text-cyan-300 font-bold drop-shadow">
                    {cell.cellId}
                  </div>
                </Link>
              );
            })}
          </div>

          <button
            onClick={() => setShowModal(false)}
            className="btn btn-ghost w-full mt-5"
          >
            닫기
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 bg-[radial-gradient(1200px_800px_at_20%_-10%,rgba(24,231,255,.06),transparent_55%),radial-gradient(1200px_800px_at_80%_-10%,rgba(139,92,246,.05),transparent_55%),#030b15]">
      {/* 상단바 */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="font-black tracking-widest">
            CELESTIA
          </Link>
          <Link to="/universe" className="btn btn-outline">
            우주 들어가기
          </Link>
        </div>
      </div>

      {/* 헤더 */}
      <div className="max-w-7xl mx-auto px-6 mt-10">
        <div className="card-glass p-6 md:p-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400/70 to-fuchsia-400/60 shadow-[0_0_30px_-6px_rgba(24,231,255,.65)]" />
            <div>
              <div className="text-2xl md:text-3xl font-extrabold">
                마이페이지
              </div>
              <div className="text-white/70">
                {user
                  ? `${user.username}님 환영합니다`
                  : "로그인 상태가 아닙니다"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-7xl mx-auto px-6 mt-10 grid lg:grid-cols-3 gap-6">
        {/* 왼쪽: 내 소유 행성 */}
        <div className="lg:col-span-2 card-glass p-6">
          <div className="text-xl font-bold mb-4">내 소유 행성</div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(grouped).length === 0 ? (
              <div className="text-white/50">
                아직 구매한 구역이 없습니다.
              </div>
            ) : (
              Object.keys(grouped).map((planetName) => (
                <button
                  key={planetName}
                  onClick={() => {
                    setSelectedPlanet(planetName);
                    setShowModal(true);
                  }}
                  className="relative rounded-xl overflow-hidden border border-cyan-400/40 hover:scale-105 transition"
                >
                  <div
                    className="w-full h-32 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${
                        planetImages[planetName] ||
                        "/textures/planet_default.jpg"
                      })`,
                      filter: "brightness(1.2) contrast(1.1)",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white drop-shadow">
                    {planetName}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 오른쪽: 설정 */}
        <div className="card-glass p-6">
          <div className="text-xl font-bold">설정</div>
          <div className="mt-4 space-y-3">
            <button className="btn btn-outline w-full">프로필 수정</button>
            <button className="btn btn-outline w-full">알림 설정</button>
            <button className="btn btn-outline w-full">보안 관리</button>
          </div>
          <div className="mt-6 hr-neon" />
          <div className="mt-6">
            <Link to="/" className="btn btn-ghost w-full">
              홈으로
            </Link>
          </div>
        </div>
      </div>

      {/* 행성 모달 */}
      {showModal && renderPlanetModal(selectedPlanet)}
    </div>
  );
}