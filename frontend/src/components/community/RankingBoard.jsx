import React, { useEffect, useState, useMemo } from "react";
import "../../styles/RankingBoard.css";
import { renderCellThumbnail } from "../../../utils/renderCellThumbnail";

// 행성 이미지 경로
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

// 정렬 옵션
const RANKING_FILTERS = [
  { id: "popular", label: "인기순" },
  { id: "latest", label: "최신순" },
  { id: "price", label: "가격순" },
];

// 랭킹 계산 공식
function computeRankingScore(cell) {
  return (
    (cell.likes || 0) * 5 +
    (cell.views || 0) +
    ((cell.price || 0) * 0.5)
  );
}

export default function RankingBoard() {
  const [filter, setFilter] = useState("popular");

  const [pixelData, setPixelData] = useState([]);    // 서버 원본
  const [thumbData, setThumbData] = useState([]);    // 썸네일 포함 최종 데이터

  const [loading, setLoading] = useState(true);

  // 1) 서버에서 데이터 가져오기
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/pixels/ranking");
        const data = await res.json();

        const withScore = data.map((c) => ({
          ...c,
          rankingScore: computeRankingScore(c),
        }));

        setPixelData(withScore);
      } catch (err) {
        console.error("🚨 랭킹로드 실패:", err);
      }
    }

    load();
  }, []);

  // 2) 썸네일 생성 → pixelData 변화와 분리됨
  useEffect(() => {
    async function generateThumbs() {
      const result = [];

      for (const cell of pixelData) {
        const planetImg = planetImages[cell.planetName];
        const thumbnail = await renderCellThumbnail(planetImg, cell);

        result.push({
          ...cell,
          thumbnail,
        });
      }

      setThumbData(result);
      setLoading(false);
    }

    if (pixelData.length > 0) generateThumbs();
  }, [pixelData]);

  // 3) 정렬된 결과 (thumbData 사용)
  const ranked = useMemo(() => {
    let arr = [...thumbData];

    if (filter === "popular") {
      arr.sort((a, b) => b.rankingScore - a.rankingScore);
    } else if (filter === "latest") {
      arr.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } else if (filter === "price") {
      arr.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return arr;
  }, [filter, thumbData]);

  if (loading)
    return (
      <h2 style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
        로딩 중...
      </h2>
    );

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="cinematic-ranking">
      <div className="ranking-shell">
        <header className="ranking-header">
          <div>
            <p className="ranking-eyebrow">CINEMATIC COSMIC HALL OF FAME</p>
            <h1>
              Kings of Celestia <span>우주 최고의 픽셀 아티스트</span>
            </h1>
            <p className="ranking-desc">
              랭킹 점수 = (좋아요 × 5) + (조회수) + (가격 × 0.5)
            </p>
          </div>

          <div className="filter-controls">
            {RANKING_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                className={`filter-pill ${filter === id ? "is-active" : ""}`}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* TOP 3 */}
        <section className="celestial-podium">
          {podium.map((item, index) => {
            const tier = ["champion", "silver", "bronze"][index];
            return (
              <article
                key={item._id}
                className={`podium-card podium-card--${tier}`}
              >
                <div className="podium-glass">
                  <div
                    className="podium-media"
                    style={{ backgroundImage: `url(${item.thumbnail})` }}
                  />
                  <div className="podium-content">
                    <p className="podium-rank">{index + 1}위</p>
                    <h2>{`Cell ${item.cellId}`}</h2>
                    <span className="podium-artist">
                      {item.ownerName || "Unknown"}
                    </span>
                    <div className="podium-metrics">
                      <span>❤️ {item.likes}</span>
                      <span>👁 {item.views}</span>
                      <span>Ξ {item.price || 0}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* 전체 리스트 */}
        <section className="stellar-list">
          {rest.map((item, idx) => (
            <div key={item._id} className="rank-row">
              <div className="rank-index">
                {String(idx + 4).padStart(2, "0")}
              </div>

              <div className="rank-artwork">
                <img src={item.thumbnail} alt="thumbnail" />
                <div>
                  <p>{`Cell ${item.cellId}`}</p>
                  <span>{item.ownerName || "Unknown"}</span>
                </div>
              </div>

              <div className="rank-stats">
                <span>❤️ {item.likes}</span>
                <span>👁 {item.views}</span>
                <span>Ξ {item.price || 0}</span>
              </div>

              <div className="rank-score">{Math.round(item.rankingScore)}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
