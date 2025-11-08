// src/pages/mypage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/celestia-styles.css";
import AppHeader from "../components/AppHeader";

export default function MyPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  // ✅ 구매 내역 불러오기
  useEffect(() => {
    if (!user || !user.id) return;

    async function fetchPurchases() {
      try {
        const token =
          localStorage.getItem("celestia_token") || localStorage.getItem("jwt");
        if (!token) return;

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
        console.log("📦 구매 데이터:", data);
        setPurchases(data);
      } catch (err) {
        console.error("❌ 구매 내역 불러오기 오류:", err);
      }
    }

    fetchPurchases();
  }, [user]);

  // ✅ 행성별 구역 묶기
  const grouped = purchases.reduce((acc, p) => {
    if (!acc[p.planetName]) acc[p.planetName] = [];
    acc[p.planetName].push(p);
    return acc;
  }, {});

  const gridSizeX = 10;
  const gridSizeY = 10; // ✅ PixelEditor 기준 통일

  // ✅ 구역 모달
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
              const bgPosX = (x / (gridSizeX - 1)) * 100;
              const bgPosY = ((gridSizeY - 1 - y) / (gridSizeY - 1)) * 100;

              return (
                <Link
                  key={cell._id}
                  to={`/pixel/edit/${cell.editToken}`}
                  className="rounded-lg overflow-hidden border border-cyan-400/40 hover:scale-105 transition relative"
                  style={{ overflow: "hidden" }}
                >
                  <div
                    className="w-full h-24 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${imgSrc})`,
                      backgroundSize: `${gridSizeX * 100}% ${gridSizeY * 100}%`,
                      backgroundPosition: `${(x / (gridSizeX - 1)) * 100}% ${(y / (gridSizeY - 1)) * 100}%`,
                      backgroundRepeat: "no-repeat",
                      filter: "brightness(1.1) contrast(1.1)",
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

  // ✅ 프로필 수정 모달
  const ProfileEditModal = ({ user, onClose }) => {
    const [username, setUsername] = useState(user.username || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const handleSave = async () => {
      try {
        const token =
          localStorage.getItem("celestia_token") || localStorage.getItem("jwt");

        if (!token) {
          setError("로그인 정보가 만료되었습니다. 다시 로그인해주세요.");
          return;
        }

        const body = { username, password: currentPassword };
        if (newPassword) body.newPassword = newPassword;

        const res = await fetch(
          `http://localhost:5000/api/auth/users/${user.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg =
            errData.message ||
            errData.error ||
            "업데이트 중 알 수 없는 오류가 발생했습니다.";
          throw new Error(errMsg);
        }

        setSuccess("✅ 프로필이 성공적으로 수정되었습니다.");
        setError(null);
        setCurrentPassword("");
        setNewPassword("");
      } catch (err) {
        console.error("프로필 수정 오류:", err);
        setError(err.message);
        setSuccess(null);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="rounded-xl bg-[#0b1622] border border-cyan-400/30 shadow-[0_0_20px_rgba(0,255,255,0.2)] w-[420px] p-8">
          <div className="text-2xl font-bold text-white mb-6 border-b border-cyan-400/30 pb-2">
            프로필 수정
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/70">새 사용자 이름</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 rounded-md bg-[#1b2431] text-white border border-cyan-400/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                placeholder="새 사용자 이름을 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-white/70">기존 비밀번호</label>
              <input
                type="password"
                className="w-full mt-1 px-3 py-2 rounded-md bg-[#1b2431] text-white border border-cyan-400/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                placeholder="현재 비밀번호를 입력하세요"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-white/70">새 비밀번호</label>
              <input
                type="password"
                className="w-full mt-1 px-3 py-2 rounded-md bg-[#1b2431] text-white border border-cyan-400/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                placeholder="변경 시에만 입력하세요"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {success && <div className="text-green-400 text-sm">{success}</div>}
            {error && <div className="text-red-400 text-sm">{error}</div>}

            <div className="flex justify-between gap-3 pt-4">
              <button
                onClick={handleSave}
                className="w-full py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition"
              >
                저장
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 bg-[radial-gradient(1200px_800px_at_20%_-10%,rgba(24,231,255,.06),transparent_55%),radial-gradient(1200px_800px_at_80%_-10%,rgba(139,92,246,.05),transparent_55%),#030b15]">
      <AppHeader activeLink="mypage" />

      {/* 헤더 */}
      <div className="max-w-7xl mx-auto px-6 mt-10">
        <div className="card-glass p-6 md:p-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400/70 to-fuchsia-400/60 shadow-[0_0_30px_-6px_rgba(24,231,255,.65)]" />
            <div>
              <div className="text-2xl md:text-3xl font-extrabold">마이페이지</div>
              <div className="text-white/70">
                {user ? `${user.username}님 환영합니다` : "로그인 상태가 아닙니다"}
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
              <div className="text-white/50">아직 구매한 구역이 없습니다.</div>
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
                      backgroundImage: `url(${planetImages[planetName] || "/textures/planet_default.jpg"})`,
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
            <button
              className="btn btn-outline w-full"
              onClick={() => setShowProfileModal(true)}
            >
              프로필 수정
            </button>
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

      {/* 모달들 */}
      {showModal && renderPlanetModal(selectedPlanet)}
      {showProfileModal && (
        <ProfileEditModal
          user={user}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
