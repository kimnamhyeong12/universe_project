import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ✅ 이전 컨텍스트 재사용
import "../styles/landing.css";

export default function SiteHeader({ anchors = {} }) {
  const nav = useNavigate();
  const auth = useAuth(); // { user, login, logout }
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [openLogin, setOpenLogin] = useState(false); // 헤더에서 로그인 모달 오픈
  const progressRef = useRef(null);

  const goto = (id) =>
    anchors[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      const h = document.documentElement;
      const p = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      if (progressRef.current) progressRef.current.style.setProperty("--progress", `${p}%`);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const items = Object.entries(anchors)
      .map(([id, r]) => ({ id, el: r.current }))
      .filter((s) => s.el);
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => e.isIntersecting && setActive(e.target.dataset.id)),
      { rootMargin: "-45% 0px -45% 0px", threshold: 0.1 }
    );
    items.forEach((s) => io.observe(s.el));
    return () => io.disconnect();
  }, [anchors]);

  // 모달 열기 이벤트는 window에 보냄 → SplashPage가 모달 렌더링
  useEffect(() => {
    if (!openLogin) return;
    window.dispatchEvent(new CustomEvent("celestia:open-login"));
    setOpenLogin(false);
  }, [openLogin]);

  const navItems = [
    { id: "about", label: "CELESTIA란?", onClick: () => goto("about") },
    { id: "capability", label: "기술 역량", onClick: () => goto("capability") },
    { id: "gallery", label: "갤러리", onClick: () => goto("gallery") },
    { id: "community", label: "커뮤니티", onClick: () => nav("/community") },
    { id: "contact", label: "문의", onClick: () => goto("contact") },
  ];

  return (
    <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
      <div className="site-header__progress" ref={progressRef} />
      <div className="site-header__inner">
        <div className="site-header__brand" onClick={() => goto("home")}>
          CELESTIA
        </div>

        <nav className="site-header__nav">
          {navItems.map(({ id, label, onClick }) => (
            <button
              key={label}
              className={`site-header__link ${active === id ? "is-active" : ""}`}
              onClick={onClick}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="site-header__actions">
          {auth?.user ? (
            <>
              <span className="site-header__user">{auth.user.username}님</span>
              <button className="btn-ghost" onClick={auth.logout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => setOpenLogin(true)}>
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
