// frontend/src/components/community/RankingBoard.jsx
import React, { useMemo, useState } from "react";
import "../../styles/RankingBoard.css";
import mockNftData from "../../data/mockNftData";
import { rankNfts, RANKING_FILTERS } from "../../utils/rankingLogic";

export default function RankingBoard() {
  const [filter, setFilter] = useState("score");
  const ranked = useMemo(() => rankNfts(mockNftData, { sortBy: filter }), [filter]);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3, 100);

  return (
    <div className="cinematic-ranking">
      <div className="cosmic-background">
        <div className="nebula-layer nebula-layer--one" />
        <div className="nebula-layer nebula-layer--two" />
        <div className="stardust drift" />
        <div className="stardust shimmer" />
      </div>

      <section className="ranking-shell">
        <header className="ranking-header">
          <div>
            <p className="ranking-eyebrow">CINEMATIC COSMIC HALL OF FAME</p>
            <h1>
              Kings of Celestia<span>우주 최고의 NFT 랭커</span>
            </h1>
            <p className="ranking-desc">
              랭킹 점수 = (좋아요 × 5) + (조회수) + (가격 × 0.5). 감히 우주라 부를 수 있는 명예의 전당에
              오를 준비가 되었나요?
            </p>
          </div>

          <div className="filter-controls" role="group" aria-label="랭킹 정렬">
            {RANKING_FILTERS.map(({ id, label }) => (
              <button
                type="button"
                key={id}
                className={`filter-pill ${filter === id ? "is-active" : ""}`}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <section className="celestial-podium">
          {podium.map((item, index) => {
            const tier = ["champion", "silver", "bronze"][index];
            return (
              <article key={item.id} className={`podium-card podium-card--${tier}`}>
                <div className="podium-glass">
                  <div className="podium-media" style={{ backgroundImage: `url(${item.thumbnail})` }} />
                  <div className="podium-overlay" />
                  <div className="podium-crown" />
                  <div className="podium-content">
                    <p className="podium-rank">{index + 1}위</p>
                    <h2>{item.title}</h2>
                    <span className="podium-artist">{item.artist}</span>
                    <div className="podium-metrics">
                      <span>❤️ {item.likes.toLocaleString()}</span>
                      <span>👁 {item.views.toLocaleString()}</span>
                      <span>Ξ {item.price}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="stellar-list">
          {rest.map((nft) => (
            <div key={nft.id} className="rank-row">
              <div className="rank-index">{nft.rank.toString().padStart(2, "0")}</div>
              <div className="rank-artwork">
                <img src={nft.thumbnail} alt={nft.title} />
                <div>
                  <p>{nft.title}</p>
                  <span>{nft.artist}</span>
                </div>
              </div>
              <div className="rank-stats">
                <span>❤️ {nft.likes.toLocaleString()}</span>
                <span>👁 {nft.views.toLocaleString()}</span>
                <span>Ξ {nft.price}</span>
              </div>
              <div className="rank-score">{Math.round(nft.rankingScore).toLocaleString()}</div>
            </div>
          ))}
        </section>
      </section>
    </div>
  );
}

