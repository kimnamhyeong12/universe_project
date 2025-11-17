// src/pages/PointChargePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppHeader from "../components/AppHeader";

export default function PointChargePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const chargeOptions = [
    { label: "💠 1,000원", KRW: 1000, amount: 10000, bonus: 0 },
    { label: "💎 5,000원", KRW: 5000, amount: 50000, bonus: 1000 },
    { label: "🔷 10,000원", KRW: 10000, amount: 100000, bonus: 3000 },
    { label: "🟣 30,000원", KRW: 30000, amount: 300000, bonus: 15000 },
    { label: "🧿 50,000원", KRW: 50000, amount: 500000, bonus: 30000 },
  ];

  const handleCharge = async (KRW, amount, bonus) => {
    if (!user || !user.token) {
      alert("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/points/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          amount: KRW,              // ⭐ 백엔드 요구사항에 맞게 수정
          points: amount + bonus,   // ⭐ 포인트 값
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "결제 세션 생성 실패");

      navigate(`/sandbox?sessionId=${data.sessionId}&type=point`);
    } catch (err) {
      console.error("❌ 충전 오류:", err);
      setMessage("❌ 충전 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#030b15] text-white">
      <AppHeader activeLink="mypage" />
      <div className="max-w-md mx-auto mt-40 card-glass p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">💳 포인트 충전</h2>

        <div className="space-y-4">
          {chargeOptions.map((opt, idx) => (
            <button
              key={idx}
              disabled={loading}
              className="w-full p-4 rounded-lg bg-gradient-to-r from-cyan-600 to-fuchsia-500 hover:brightness-110 shadow-md text-white text-lg font-semibold flex justify-between items-center"
              onClick={() => handleCharge(opt.KRW, opt.amount, opt.bonus)}
            >
              <span>{opt.label}</span>
              <span>
                {(opt.amount + opt.bonus).toLocaleString()}P
                {opt.bonus > 0 && (
                  <span className="text-green-300 font-bold ml-2">
                    +{opt.bonus.toLocaleString()}P
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {message && <p className="mt-6 text-center text-cyan-300">{message}</p>}

        <button
          className="mt-8 btn btn-ghost w-full"
          onClick={() => navigate("/mypage")}
        >
          ⬅ 마이페이지로 돌아가기
        </button>
      </div>
    </div>
  );
}
