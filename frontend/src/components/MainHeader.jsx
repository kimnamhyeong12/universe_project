import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/landing.css";

export default function MainHeader({ onModalOpen, anchors }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  const go = (id) => {
    if (anchors?.[id]?.current) {
      anchors[id].current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      nav(`/#${id}`);
    }
    setOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl">
        <div className="mx-3 md:mx-6 mt-4 rounded-2xl border border-white/10 bg-black/25 backdrop-blur-xl">
          <div className="px-4 md:px-6 py-3 flex items-center justify-between">
            <button className="font-black tracking-widest text-white text-xl" onClick={() => go("home")}>
              CELESTIA
            </button>

            <nav className="hidden md:flex items-center gap-1">
              <button onClick={() => go("about")}   className="px-3 py-2 text-white/80 hover:text-white">CELESTIA란?</button>
              <button onClick={() => go("guide")}   className="px-3 py-2 text-white/80 hover:text-white">이용 가이드</button>
              <button onClick={() => go("gallery")} className="px-3 py-2 text-white/80 hover:text-white">갤러리</button>
              <button onClick={() => go("team")}    className="px-3 py-2 text-white/80 hover:text-white">팀 소개</button>
              <span className="mx-3 h-5 w-px bg-white/15" />
              <Link to="/mypage" className="px-3 py-2 text-white/80 hover:text-white">마이페이지</Link>
            </nav>

            <div className="hidden md:flex items-center gap-2">
              <Link to="/universe" className="btn-ghost">3D 입장</Link>
              {user ? (
                <>
                  <span className="text-white/80">{user.username}님</span>
                  <button className="btn-ghost" onClick={logout}>로그아웃</button>
                </>
              ) : (
                <button className="btn-glow" onClick={() => onModalOpen?.("login")}>로그인</button>
              )}
            </div>

            <button className="md:hidden btn-ghost px-3 py-2" onClick={() => setOpen(v=>!v)}>메뉴</button>
          </div>

          {open && (
            <div className="md:hidden px-4 pb-4 grid gap-2">
              {["about","guide","gallery","team","shop"].map(k=>(
                <button key={k} onClick={()=>go(k)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10">
                  {k==="about"?"CELESTIA란?":k==="guide"?"이용 가이드":k==="gallery"?"갤러리":k==="team"?"팀 소개":"구매창"}
                </button>
              ))}
              <Link to="/mypage" onClick={()=>setOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/10">마이페이지</Link>
              <div className="flex items-center gap-2 pt-2">
                <Link to="/universe" className="btn-ghost w-full">3D 입장</Link>
                {user ? (
                  <button className="btn-ghost w-full" onClick={logout}>로그아웃</button>
                ) : (
                  <button className="btn-glow w-full" onClick={()=>{onModalOpen?.("login");setOpen(false);}}>로그인</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
