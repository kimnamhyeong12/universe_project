// src/pages/SplashPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";
import GalleryHallOfFame from "../components/home/GalleryHallOfFame.jsx";
import { useAuth } from "../context/AuthContext";
import "../styles/landing.css";

export default function SplashPage({ onEnter }) {
  const nav = useNavigate();
  const auth = useAuth();
 

  const refs = {
    home: useRef(null),
    about: useRef(null),
    capability: useRef(null),
    programs: useRef(null),
    gallery: useRef(null),
    contact: useRef(null),
  };

  useEffect(() => {
    const hero = refs.home.current;
    if (!hero) return;
    const onMove = (e) => {
      const x = (e.clientX - window.innerWidth / 2) / window.innerWidth;
      const y = (e.clientY - window.innerHeight / 2) / window.innerHeight;
      hero.style.setProperty("--mx", `${x}`);
      hero.style.setProperty("--my", `${y}`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.target.classList.toggle("reveal--show", en.isIntersecting)),
      { threshold: 0.2 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleEnter = () => (onEnter ?  nav("/universe") : onEnter());

  // ✅ 마켓 페이지로 이동 (선택 플랜 전달)
  const gotoMarket = (planName) => {
    nav("/market", { state: { plan: planName } });
  };

  return (
    <>
      <SiteHeader anchors={refs} />

      {/* HERO */}
<section ref={refs.home} data-id="home" className="hero">
  <video className="hero__bg" autoPlay muted loop playsInline>
    <source src="/celestia_bg.mp4" type="video/mp4" />
  </video>

  {/* 어둡게 덮는 레이어들 */}
  <div className="hero__scrim" />
  <div className="hero__stars" />

  {/* 콘텐츠 레이어(최상단) */}
  <div className="hero__inner">
    <h1 className="hero__title">CELESTIA</h1>
    <p className="hero__subtitle">나만의 우주를 소유하고, 창조하세요.</p>

    {/* ✅ 입장 버튼 (콘텐츠 레이어 내부 + z-index 보장) */}
    <button className="btn-light-glass btn-xl hero__cta" onClick={handleEnter}>
      CELESTIA 입장하기
    </button>
  </div>
</section>

      {/* ABOUT */}
      <section ref={refs.about} data-id="about" className="section">
        <div className="section__bg" style={{ backgroundImage: "url(/assets/sections/about.jpg)" }} />
        <div className="section__inner">
          <div className="grid grid-2">
            <div className="reveal">
              <h2 className="section__title">CELESTIA란?</h2>
              <p className="section__desc">
                CELESTIA는 디지털 우주에서 <b>소유</b>와 <b>창작</b>을 결합한 프리미엄 인터랙션입니다.
                행성 구역을 소유하고, 픽셀 아트로 우주를 채우세요.
              </p>
              <div className="hr-neon" />
            </div>
            <div className="reveal delay-1">
              <div className="card-glass p-24">
                <h3 className="card__title">핵심 가치</h3>
                <ul className="card__list">
                  <li>소유권 중심의 지속성</li>
                  <li>크리에이터 퍼스트 도구</li>
                  <li>전시 · 교류 · 거래 생태계</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITY */}
      <section ref={refs.capability} data-id="capability" className="section dark">
        <div className="section__bg" style={{ backgroundImage: "url(/assets/sections/capability.jpg)" }} />
        <div className="section__inner">
          <h2 className="section__title reveal">기술 역량</h2>
          <div className="grid grid-3 mt-24">
            {[
              ["Cinematic 3D", "React Three Fiber + postprocessing 시네마틱 연출"],
              ["Orbit System", "자전/공전 · 카메라 스냅/팔로우"],
              ["Pixel Studio", "Konva 기반 고성능 픽셀 에디터"],
            ].map(([t, d], i) => (
              <div key={t} className={`card-glass p-20 reveal delay-${i}`}>
                <div className="badge">CAP {`0${i + 1}`}</div>
                <h3 className="card__title">{t}</h3>
                <p className="card__desc">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

     

      {/* GALLERY */}
      <section ref={refs.gallery} data-id="gallery" className="section dark">
        <div className="section__bg" style={{ backgroundImage: "url(/assets/sections/gallery.jpg)" }} />
        <div className="section__inner">
          <div className="row between center reveal">
            <h2 className="section__title">갤러리</h2>
            <button className="btn-outline">전체 보기</button>
          </div>
          <div className="masonry mt-24">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="masonry__item reveal"
                style={{ backgroundImage: `url(/assets/sections/gal_${(i % 5) + 1}.jpg)` }}
              />
            ))}
          </div>
          <GalleryHallOfFame />
        </div>
      </section>

      {/* CONTACT */}
      <section ref={refs.contact} data-id="contact" className="section">
        <div className="section__bg" style={{ backgroundImage: "url(/assets/sections/contact.jpg)" }} />
        <div className="section__inner center reveal">
          <h2 className="section__title">문의하기</h2>
          <p className="section__desc">협업/스폰서십/교육 프로그램 문의 환영합니다.</p>
          <div className="row center mt-16">
            <a className="btn-outline" href="mailto:team@celestia.app">
              team@celestia.app
            </a>
            <button className="btn-glow ml-12" onClick={handleEnter}>
                우주로 이동
            </button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">CELESTIA</div>
          <div className="footer__copy">© {new Date().getFullYear()} Celestia Team. All rights reserved.</div>
        </div>
      </footer>

      
    </>
  );
}
