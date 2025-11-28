// ✅ src/components/AppHeader.jsx (새 파일)

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/landing.css"; // 홈 헤더 CSS (SiteHeader.jsx와 동일)

export default function AppHeader({ activeLink }) {
  const nav = useNavigate();
  const { user, logout } = useAuth(); // useAuth()로 변경 (SiteHeader.jsx 참조)

  const handleLogin = () => {
    // SiteHeader가 사용하던 전역 이벤트를 동일하게 사용
    window.dispatchEvent(new CustomEvent("celestia:open-login"));
  };

  return (
    // site-header--scrolled를 기본으로 사용하여 배경을 항상 어둡게 함
    <header className="site-header site-header--scrolled"> 
      <div className="site-header__inner">
        
        {/* 1. Left: Logo (클릭 시 홈으로) */}
        <Link to="/" className="site-header__brand">
          CELESTIA
        </Link>

        {/* 2. Center: App Nav Links (PDF 요청) */}
        <nav className="site-header__nav">
          <Link 
            to="/Universe" 
            className={`site-header__link ${activeLink === "universe" ? "is-active" : ""}`}
          >
            우주공간
          </Link>
          <Link 
            to="/mypage" 
            className={`site-header__link ${activeLink === "mypage" ? "is-active" : ""}`}
          >
            마이페이지
          </Link>
          <Link 
            to="/market" 
            className={`site-header__link ${activeLink === "market" ? "is-active" : ""}`}
          >
            상점
          </Link>
          <Link 
            to="/nftmarket" 
            className={`site-header__link ${activeLink === "nftmarket" ? "is-active" : ""}`}
          >
            NFT상점
          </Link>
        </nav>

        {/* 3. Right: Auth actions (치우침 방지 레이아웃 적용됨) */}
        <div className="site-header__actions">
          {user ? (
            <>
            
              <span className="site-header__user">{user.username}님</span>
              <button className="btn-ghost" onClick={logout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={handleLogin}>
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}