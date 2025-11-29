// =========================================
// 🔥 rankingLogic.js — 프론트 정렬 유틸
// =========================================

export const RANKING_FILTERS = [
  { id: "score", label: "인기순" },
  { id: "views", label: "조회순" },
  { id: "price", label: "가격순" },
];

// ⭐ 랭킹 계산 공식
function calcScore(item) {
  return (item.likes || 0) * 5 + (item.views || 0) + (item.price || 0) * 0.5;
}

// ⭐ 메인 랭킹 정렬 함수
export function rankNfts(data, { sortBy = "score" } = {}) {
  const enriched = data.map((item) => ({
    ...item,
    rankingScore: calcScore(item),
  }));

  switch (sortBy) {
    case "views":
      return enriched.sort((a, b) => b.views - a.views);
    case "price":
      return enriched.sort((a, b) => b.price - a.price);
    case "score":
    default:
      return enriched.sort((a, b) => b.rankingScore - a.rankingScore);
  }
}
