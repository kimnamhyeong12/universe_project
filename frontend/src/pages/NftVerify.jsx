import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/celestia-styles.css"; // 필요 시

export default function NftVerify() {
  const { id } = useParams();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/nft/verify/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setNotFound(true);
        } else {
          setNft(data.nft);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="verify-box">🔍 인증 중...</div>;
  if (notFound) return <div className="verify-box invalid">❌ 유효하지 않은 NFT입니다.</div>;

  return (
    <div className="verify-container">
      <div className="verify-box">
        <h1>🔐 NFT 정품 인증서</h1>

        <img
          src={nft.imageDataUrl}
          alt="NFT Artwork"
          style={{ width: 240, borderRadius: 12, margin: "20px 0" }}
        />

        <p><b>소유자</b>: {nft.ownerName}</p>
        <p><b>행성</b>: {nft.planetName}</p>
        <p><b>셀 ID</b>: {nft.cellId}</p>

        <p style={{ marginTop: 20, fontSize: 14, opacity: 0.7 }}>
          발행됨: {new Date(nft.updatedAt).toLocaleString()}
        </p>

        <p className="valid-mark">✔ 정품 NFT로 인증되었습니다.</p>
      </div>
    </div>
  );
}
