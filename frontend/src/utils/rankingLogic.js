// frontend/src/utils/rankingLogic.js

/**
 * 기본 랭킹 점수 계산
 * 공식: (좋아요 × 5) + (조회수 × 1) + (가격 × 0.5)
 */
export const calculateRankingScore = ({ likes = 0, views = 0, price = 0 }) => {
  const likeScore = Number(likes) * 5;
  const viewScore = Number(views);
  const priceScore = Number(price) * 0.5;
  return likeScore + viewScore + priceScore;
};

/**
 * NFT 배열을 랭킹 점수 기반으로 정렬
 * @param {Array} nfts
 * @param {Object} options
 * @param {"score" | "latest" | "price"} options.sortBy
 * @returns {Array} rank가 부여된 NFT 목록
 */
export const rankNfts = (nfts = [], options = {}) => {
  const { sortBy = "score" } = options;

  const enriched = nfts.map((nft) => ({
    ...nft,
    rankingScore: calculateRankingScore(nft),
  }));

  const sorted = [...enriched].sort((a, b) => {
    if (sortBy === "latest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === "price") {
      return b.price - a.price;
    }
    // 기본: score / popular
    if (b.rankingScore === a.rankingScore) {
      return b.likes - a.likes;
    }
    return b.rankingScore - a.rankingScore;
  });

  return sorted.map((nft, index) => ({
    ...nft,
    rank: index + 1,
  }));
};

export const RANKING_FILTERS = [
  { id: "score", label: "인기순" },
  { id: "latest", label: "최신순" },
  { id: "price", label: "가격순" },
];

