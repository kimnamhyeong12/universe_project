// frontend/src/pages/community/CommunityHome.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/community.css";

const planetShowcase = [
  {
    id: 1,
    name: "Aethelguard Prime",
    artist: "NovaExplorer",
    likes: "5k",
    imageUrl: "/textures/planet_default.jpg",
  },
  {
    id: 2,
    name: "Aethelguard Prime",
    artist: "NovaExplorer",
    likes: "3k",
    imageUrl: "/textures/earth.jpg",
  },
  {
    id: 3,
    name: "Planet",
    artist: "NovaExplorer",
    likes: "3k",
    imageUrl: "/textures/mars.jpg",
  },
  {
    id: 4,
    name: "Earthn Prime",
    artist: "NovaExplorer",
    likes: "3k",
    imageUrl: "/textures/neptune.jpg",
  },
  {
    id: 5,
    name: "Monthin",
    artist: "NovaExplorer",
    likes: "2k",
    imageUrl: "/textures/saturn.jpg",
  },
];

const translations = {
  ko: {
    navLinks: [
      { id: "home", label: "홈", href: "#home", isActive: true },
      { id: "gallery", label: "갤러리", href: "#gallery" },
      { id: "forum", label: "포럼", href: "#forum" },
      { id: "events", label: "이벤트", href: "#events" },
    ],
    profileName: "탐험가",
    hero: {
      eyebrow: "은하",
      titleLines: ["은하 창작", "콘테스트"],
      subtitle: "우주 창작자들이 함께 만드는 NFT 커뮤니티",
      cta: "출전 포털 열기",
    },
    heroStats: [
      { id: 1, label: "출품작", value: "1,482+" },
      { id: 2, label: "상금 풀", value: "320 ETH" },
      { id: 3, label: "온라인 시스템", value: "27 클러스터" },
    ],
    sections: {
      popular: "인기 행성",
      recent: "최신 게시글",
      community: "실시간 커뮤니티 채널",
      market: "NFT 시세 정보",
    },
    slider: {
      prevPlanets: "이전 행성",
      nextPlanets: "다음 행성",
      prevPosts: "이전 게시글",
      nextPosts: "다음 게시글",
    },
    labels: {
      artist: "아티스트",
      by: "작성자",
      volume: "24시간 거래량 · ",
    },
    buttons: {
      market: "전체 마켓 보기",
      language: "언어 선택",
    },
    badges: {
      live: "실시간",
    },
    popularPlanets: planetShowcase,
    recentPosts: [
      {
        id: 1,
        tag: "tip",
        label: "팁",
        title: "NFT 행성 민팅 온보딩 가이드",
        author: "NovaExplorer",
        timeAgo: "3시간 전",
      },
      {
        id: 2,
        tag: "discussion",
        label: "토론",
        title: "AI 생성 지형을 어떻게 밸런싱할까?",
        author: "NovaExplorer",
        timeAgo: "2시간 전",
      },
      {
        id: 3,
        tag: "discussion",
        label: "토론",
        title: "그라비타 코어 업데이트 후기 공유",
        author: "NovaExplorer",
        timeAgo: "1시간 전",
      },
    ],
    communityChats: [
      {
        id: 1,
        title: "오로라 격납고",
        snippet: "새 링 월드 아트 공개! 피드백 환영합니다.",
        participants: "탐험가 58명 접속 중",
      },
      {
        id: 2,
        title: "마켓 토크",
        snippet: "가스비 절감 민팅 전략 Q&A 진행 중...",
        participants: "트레이더 32명 접속 중",
      },
      {
        id: 3,
        title: "세계관 작가실",
        snippet: "Planet 0x7F 배경 스토리 합작 모집!",
        participants: "스토리텔러 21명 접속 중",
      },
    ],
    marketPulse: [
      {
        id: 1,
        name: "Aethelguard Prime",
        price: "12.4 ETH",
        change: "+4.2%",
        volume: "1.2k",
        status: "up",
      },
      {
        id: 2,
        name: "Earthn Prime",
        price: "9.8 ETH",
        change: "-1.1%",
        volume: "890",
        status: "down",
      },
      {
        id: 3,
        name: "Monthin",
        price: "7.2 ETH",
        change: "+0.8%",
        volume: "640",
        status: "up",
      },
    ],
  },
  en: {
    navLinks: [
      { id: "home", label: "Home", href: "#home", isActive: true },
      { id: "gallery", label: "Gallery", href: "#gallery" },
      { id: "forum", label: "Forum", href: "#forum" },
      { id: "events", label: "Events", href: "#events" },
    ],
    profileName: "You",
    hero: {
      eyebrow: "GALACTIC",
      titleLines: ["CREATION", "CONTEST"],
      subtitle: "Space-user-created NFT community",
      cta: "Launch Entry Portal",
    },
    heroStats: [
      { id: 1, label: "Contest Entries", value: "1,482+" },
      { id: 2, label: "Prize Pool", value: "320 ETH" },
      { id: 3, label: "Systems Online", value: "27 Clusters" },
    ],
    sections: {
      popular: "Popular Planets",
      recent: "Recent Posts",
      community: "Community Channels",
      market: "NFT Market Pulse",
    },
    slider: {
      prevPlanets: "Previous planets",
      nextPlanets: "Next planets",
      prevPosts: "Previous posts",
      nextPosts: "Next posts",
    },
    labels: {
      artist: "Artist",
      by: "By",
      volume: "24h Volume · ",
    },
    buttons: {
      market: "View Full Market",
      language: "Language",
    },
    badges: {
      live: "Live now",
    },
    popularPlanets: planetShowcase,
    recentPosts: [
      {
        id: 1,
        tag: "tip",
        label: "Tip",
        title: "Welcome to curated planet minting",
        author: "NovaExplorer",
        timeAgo: "3 hours ago",
      },
      {
        id: 2,
        tag: "discussion",
        label: "Discussion",
        title: "Can AI terrain stay balanced for PvE?",
        author: "NovaExplorer",
        timeAgo: "2 hours ago",
      },
      {
        id: 3,
        tag: "discussion",
        label: "Discussion",
        title: "Share your Gravita core update results",
        author: "NovaExplorer",
        timeAgo: "1 hour ago",
      },
    ],
    communityChats: [
      {
        id: 1,
        title: "Aurora Hangar",
        snippet: "New ring world art is up! Feedback welcome.",
        participants: "58 explorers online",
      },
      {
        id: 2,
        title: "Marketplace Talk",
        snippet: "Live Q&A on gas-saving mint strategies...",
        participants: "32 traders online",
      },
      {
        id: 3,
        title: "Lore Writers",
        snippet: "Recruiting collaborators for Planet 0x7F lore!",
        participants: "21 storytellers online",
      },
    ],
    marketPulse: [
      {
        id: 1,
        name: "Aethelguard Prime",
        price: "12.4 ETH",
        change: "+4.2%",
        volume: "1.2k",
        status: "up",
      },
      {
        id: 2,
        name: "Earthn Prime",
        price: "9.8 ETH",
        change: "-1.1%",
        volume: "890",
        status: "down",
      },
      {
        id: 3,
        name: "Monthin",
        price: "7.2 ETH",
        change: "+0.8%",
        volume: "640",
        status: "up",
      },
    ],
  },
};

export default function CommunityHome() {
  const [locale, setLocale] = useState("ko");
  const content = translations[locale];

  return (
    <div className="community-page">
      <div className="community-bg-overlay" />
      <div className="community-stars" />
      <div className="community-nebula nebula-left" />
      <div className="community-nebula nebula-right" />
      <header className="community-nav">
        <div className="logo">CELESTIA</div>
        <nav className="nav-links">
          {content.navLinks.map((link) => (
            <a key={link.id} href={link.href} className={link.isActive ? "active" : ""}>
              {link.label}
            </a>
          ))}
          <Link to="/community/ranking" className="ranking-link">
            Ranking
          </Link>
        </nav>
        <div className="language-toggle" role="group" aria-label={content.buttons.language}>
          {["ko", "en"].map((code) => (
            <button
              key={code}
              type="button"
              className={`lang-btn ${locale === code ? "is-active" : ""}`}
              onClick={() => setLocale(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="profile-area">
          <div className="avatar" aria-hidden="true" />
          <span className="profile-name">{content.profileName}</span>
          <span className="dropdown-icon">⌄</span>
        </div>
      </header>

      <main className="community-content">
        <section className="hero-card">
          <div className="hero-text">
            <p className="eyebrow">{content.hero.eyebrow}</p>
            <h1>
              {content.hero.titleLines.map((line, index) => (
                <React.Fragment key={line}>
                  {line}
                  {index !== content.hero.titleLines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </h1>
            <p className="subtitle">{content.hero.subtitle}</p>
            <button className="cta-button">{content.hero.cta}</button>
            <div className="hero-stats">
              {content.heroStats.map((stat) => (
                <div key={stat.id} className="hero-stat">
                  <span className="value">{stat.value}</span>
                  <span className="label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-illustration">
            <div className="planet-glow" />
            <div className="orbit-ring orbit-ring--outer" />
            <div className="orbit-ring orbit-ring--inner" />
            <div className="satellite" />
          </div>
        </section>

        <section className="section-panel" id="popular">
          <div className="section-header">
            <h2>{content.sections.popular}</h2>
            <div className="slider-controls">
              <button aria-label={content.slider.prevPlanets}>‹</button>
              <button aria-label={content.slider.nextPlanets}>›</button>
            </div>
          </div>
          <div className="planet-grid">
            {content.popularPlanets.map((planet) => (
              <article key={planet.id} className="planet-card">
                <div className="planet-thumb">
                  <img src={planet.imageUrl} alt={planet.name} />
                </div>
                <div className="planet-meta">
                  <div>
                    <h3>{planet.name}</h3>
                    <p>
                      {content.labels.artist}: {planet.artist}
                    </p>
                  </div>
                  <span className="likes">{planet.likes}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dual-panel">
          <div className="section-panel" id="recent-posts">
            <div className="section-header">
              <h2>{content.sections.recent}</h2>
              <div className="slider-controls">
                <button aria-label={content.slider.prevPosts}>‹</button>
                <button aria-label={content.slider.nextPosts}>›</button>
              </div>
            </div>
            <div className="posts-list">
              {content.recentPosts.map((post) => (
                <article key={post.id} className="post-row">
                  <span className={`post-tag tag-${post.tag}`}>{post.label}</span>
                  <div className="post-body">
                    <h4>{post.title}</h4>
                    <p>
                      {content.labels.by} {post.author}
                    </p>
                  </div>
                  <span className="post-time">{post.timeAgo}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="section-panel community-panel">
            <div className="section-header">
              <h2>{content.sections.community}</h2>
              <span className="online-pill">{content.badges.live}</span>
            </div>
            <div className="chat-list">
              {content.communityChats.map((chat) => (
                <article key={chat.id} className="chat-row">
                  <div>
                    <h4>{chat.title}</h4>
                    <p>{chat.snippet}</p>
                  </div>
                  <span>{chat.participants}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-panel market-panel">
          <div className="section-header">
            <h2>{content.sections.market}</h2>
            <button className="ghost-button">{content.buttons.market}</button>
          </div>
          <div className="market-grid">
            {content.marketPulse.map((item) => (
              <article key={item.id} className="market-card">
                <div className="market-card__head">
                  <h3>{item.name}</h3>
                  <span className={`trend ${item.status}`}>{item.change}</span>
                </div>
                <p className="price">{item.price}</p>
                <p className="volume">
                  {content.labels.volume}
                  {item.volume}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

