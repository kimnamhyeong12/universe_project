// frontend/src/components/home/GalleryHallOfFame.jsx
import React, { useMemo } from "react";
import "../../styles/RankingSystem.css";
import mockNftData from "../../data/mockNftData";
import { rankNfts } from "../../utils/rankingLogic";

const haloClasses = ["gold", "silver", "bronze"];
const rankBadges = ["👑", "Ⅱ", "Ⅲ"];

export default function GalleryHallOfFame() {
  const topThree = useMemo(() => rankNfts(mockNftData).slice(0, 3), []);

  if (!topThree.length) {
    return null;
  }

  return (
    <section className="hall-of-fame">
      <div className="hof-header">
        <p className="hof-eyebrow">Hall of Fame</p>
        <h3>가장 빛나는 우주 NFT</h3>
        <p className="hof-desc">랭킹 점수 = (좋아요 × 5) + 조회수 + (가격 × 0.5)</p>
      </div>

      <div className="hof-grid">
        {topThree.map((planet, index) => (
          <article
            key={planet.id}
            className={`hof-card hof-card--${haloClasses[index]}`}
            style={{ backgroundImage: `url(${planet.thumbnail})` }}
          >
            <div className="hof-card__overlay" />
            <div className="hof-card__content">
              <span className="hof-rank-icon">{rankBadges[index]}</span>
              <p className="hof-rank-label">{index + 1}위</p>
              <h4>{planet.title}</h4>
              <p className="hof-artist">{planet.artist}</p>
              <div className="hof-metrics">
                <span>❤️ {planet.likes.toLocaleString()}</span>
                <span>👁 {planet.views.toLocaleString()}</span>
                <span>Ξ {planet.price}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

