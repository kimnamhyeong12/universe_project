// src/pages/SplashPage.jsx
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import MainHeader from "../components/MainHeader.jsx";
import Modal from "../components/Modal.jsx";

// 3D/공용 스타일(있다면 유지)
import "../styles/celestia-styles.css";
// 랜딩 전용 스코프 스타일
import "../styles/landing.css";

export default function SplashPage({ onEnter }) {
  const nav = useNavigate();
  const [modal, setModal] = useState(null);

  const refs = {
    home: useRef(null),
    about: useRef(null),
    guide: useRef(null),
    gallery: useRef(null),
    team: useRef(null),
    shop: useRef(null),
  };

  const handleEnter = () => (onEnter ? onEnter() : nav("/universe"));

  return (
    <div className="splash">
      {/* 헤더 (상단 네비) */}
      <MainHeader onModalOpen={setModal} anchors={refs} />

      {/* HERO */}
      <section ref={refs.home} id="home" className="relative h-screen w-screen overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/celestia_bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,.25),rgba(0,0,0,.85))]" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="heading-hero text-[14vw] md:text-8xl">
            CELESTIA
          </h1>
          <p className="sub-hero mt-6 text-lg md:text-2xl">나만의 우주를 소유하고, 창조하세요.</p>

          <div className="mt-12">
            <button onClick={handleEnter} className="btn-glow">
              CELESTIA 입장하기
            </button>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section ref={refs.about} id="about" className="section-wrap">
        <div className="bg" style={{ backgroundImage: "url(/assets/sections/about.jpg)" }} />
        <div className="scrim" />
        <div className="grain" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-28">
          <h2 className="section-title text-4xl md:text-5xl">CELESTIA란?</h2>
          <p className="mt-6 text-white/85 leading-relaxed text-lg max-w-3xl">
            CELESTIA는 디지털 우주에서 <b className="text-cyan-300">소유</b>와 <b className="text-cyan-300">창작</b>을 결합한
            인터랙티브 경험입니다. 행성의 구역을 구매하고 그 위에 직접 픽셀 아트를 창조해 우주에 당신의 흔적을 남기세요.
          </p>
          <div className="mt-10 hr-neon" />
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { t: "우주 소유권", d: "행성의 특정 구역을 구매해 나만의 공간으로." },
              { t: "픽셀 창작", d: "브라우저에서 바로 그려지는 픽셀 에디터." },
              { t: "커뮤니티", d: "갤러리에 전시하고 교류하고 거래하기." },
            ].map((c, i) => (
              <div key={i} className="card-glass p-6 hover:-translate-y-1 transition">
                <div className="text-2xl font-bold mb-2">{c.t}</div>
                <p className="text-white/80">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GUIDE */}
      <section ref={refs.guide} id="guide" className="section-wrap">
        <div className="bg" style={{ backgroundImage: "url(/assets/sections/guide.jpg)" }} />
        <div className="scrim" />
        <div className="grain" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-28">
          <h2 className="section-title text-4xl md:text-5xl">이용 가이드</h2>
          <div className="mt-12 grid lg:grid-cols-3 gap-6">
            {[
              { n: "01", t: "우주 탐험", d: "3D 공간에서 항성/행성을 탐험하고 마음에 드는 곳을 찾으세요." },
              { n: "02", t: "구역 구매", d: "행성의 픽셀 구역을 구매하여 나만의 영토로." },
              { n: "03", t: "픽셀 창작", d: "픽셀 에디터로 작품을 전시하고 공유하세요." },
            ].map((s) => (
              <div key={s.n} className="card-glass p-6 relative overflow-hidden">
                <div className="text-cyan-300 font-bold">{s.n}</div>
                <div className="text-2xl font-extrabold">{s.t}</div>
                <p className="mt-3 text-white/80">{s.d}</p>
                <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-cyan-400/12 blur-2xl" />
              </div>
            ))}
          </div>
          <div className="mt-10">
            <button className="btn-glow" onClick={handleEnter}>
              지금 3D 입장
            </button>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section ref={refs.gallery} id="gallery" className="section-wrap">
        <div className="bg" style={{ backgroundImage: "url(/assets/sections/gallery.jpg)" }} />
        <div className="scrim" />
        <div className="grain" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-28">
          <div className="flex items-end justify-between">
            <h2 className="section-title text-4xl md:text-5xl">갤러리</h2>
            <button className="btn-ghost">전체 보기</button>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="thumb bg-gradient-to-br from-cyan-400/20 to-fuchsia-400/10" />
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section ref={refs.team} id="team" className="section-wrap">
        <div className="bg" style={{ backgroundImage: "url(/assets/sections/team.jpg)" }} />
        <div className="scrim" />
        <div className="grain" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-28">
          <h2 className="section-title text-4xl md:text-5xl">팀 소개</h2>
          <p className="mt-3 text-white/80">동아대학교 SW중심대학사업 D-Lab · CELESTIA 팀</p>
          <div className="mt-10 grid md:grid-cols-4 gap-6">
            {[
              { n: "김남형", r: "팀장 (기관 참여)" },
              { n: "조영준", r: "프론트엔드" },
              { n: "정권호", r: "백엔드" },
              { n: "모준호", r: "백엔드" },
            ].map((m) => (
              <div key={m.n} className="card-glass p-6">
                <div className="h-28 rounded-xl bg-white/10 mb-4" />
                <div className="text-xl font-bold">{m.n}</div>
                <div className="text-white/75">{m.r}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOP */}
      <section ref={refs.shop} id="shop" className="section-wrap">
        <div className="bg" style={{ backgroundImage: "url(/assets/sections/shop.jpg)" }} />
        <div className="scrim" />
        <div className="grain" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-28">
          <h2 className="section-title text-4xl md:text-5xl">구매창</h2>
          <p className="mt-3 text-white/80">행성 구역(픽셀)을 구매하고 소유권을 획득하세요.</p>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { name: "Starter", price: "₩9,900", feat: ["구역 10×10", "기본 뱃지"] },
              { name: "Creator", price: "₩29,900", feat: ["구역 20×20", "프로 뱃지", "확장 팔레트"] },
              { name: "Legend", price: "₩79,900", feat: ["구역 40×40", "레전드 뱃지", "특수 이펙트"] },
            ].map((p, i) => (
              <div key={i} className="card-glass p-6 flex flex-col">
                <div className="text-2xl font-bold">{p.name}</div>
                <div className="mt-2 text-3xl font-extrabold">{p.price}</div>
                <ul className="mt-4 space-y-2 text-white/85">
                  {p.feat.map((f, idx) => (
                    <li key={idx}>• {f}</li>
                  ))}
                </ul>
                <button className="btn-glow mt-6" onClick={() => alert(`[${p.name}] 플랜 구매`)}>
                  구매하기
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 로그인 모달 */}
      <Modal title="로그인" isOpen={modal === "login"} onClose={() => setModal(null)} />
    </div>
  );
}
