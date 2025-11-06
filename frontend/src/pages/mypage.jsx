import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/celestia-styles.css";

export default function MyPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen pb-24 bg-[radial-gradient(1200px_800px_at_20%_-10%,rgba(24,231,255,.06),transparent_55%),radial-gradient(1200px_800px_at_80%_-10%,rgba(139,92,246,.05),transparent_55%),#030b15]">
      {/* Top bar */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="font-black tracking-widest">CELESTIA</Link>
          <Link to="/universe" className="btn btn-outline">우주 들어가기</Link>
        </div>
      </div>

      {/* Header banner */}
      <div className="max-w-7xl mx-auto px-6 mt-10">
        <div className="card-glass p-6 md:p-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400/70 to-fuchsia-400/60 shadow-[0_0_30px_-6px_rgba(24,231,255,.65)]" />
            <div>
              <div className="text-2xl md:text-3xl font-extrabold">마이페이지</div>
              <div className="text-white/70">{user ? `${user.username}님 환영합니다` : "로그인 상태가 아닙니다"}</div>
            </div>
          </div>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {[
              { k:"보유 구역", v:"12" },
              { k:"작품 수",  v:"5"  },
              { k:"좋아요",  v:"128"},
            ].map((s,i)=>(
              <div key={i} className="card-glass p-4">
                <div className="text-white/70 text-sm">{s.k}</div>
                <div className="text-2xl font-extrabold mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 mt-10 grid lg:grid-cols-3 gap-6">
        {/* Assets */}
        <div className="lg:col-span-2 card-glass p-6">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold">내 소유 구역</div>
            <button className="btn btn-ghost">관리</button>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} className="thumb bg-gradient-to-br from-cyan-400/15 to-fuchsia-400/10" />
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="card-glass p-6">
          <div className="text-xl font-bold">설정</div>
          <div className="mt-4 space-y-3">
            <button className="btn btn-outline w-full">프로필 수정</button>
            <button className="btn btn-outline w-full">알림 설정</button>
            <button className="btn btn-outline w-full">보안 관리</button>
          </div>
          <div className="mt-6 hr-neon" />
          <div className="mt-6">
            <Link to="/" className="btn btn-ghost w-full">홈으로</Link>
          </div>
        </div>
      </div>
    </div>
  );
}