// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import SplashPage from "./pages/SplashPage.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import Universe from "./pages/Universe.jsx";
import MyPage from "./pages/mypage.jsx";
import MarketPage from "./pages/MarketPage.jsx";

// ✅ PixelEditor, ViewPlanet 페이지 추가
import PixelEditor from "./pages/PixelEditor.jsx";
import ViewPlanet from "./pages/ViewPlanet.jsx"; // 🔥 추가 라인

// Toss
import { CheckoutPage } from "./pages/Checkout";
import { SuccessPage } from "./pages/Success";
import { FailPage } from "./pages/Fail";



function LandingShell() {
  const [view, setView] = useState("splash");
  const loc = useLocation();

  const handleEnter = () => {
    setView("loading");
    setTimeout(() => setView("app"), 1800);
  };

  useEffect(() => {
    if (loc.state?.autoEnter && view === "splash") handleEnter();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.activeElement?.blur?.();
  }, [loc.state, view]);

  return (
    <>
      {view === "splash" && <SplashPage onEnter={handleEnter} />}
      {view === "loading" && <LoadingScreen />}
      {view === "app" && <Universe />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingShell />} />
          <Route path="/universe" element={<Universe />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/mypage" element={<MyPage />} />

          {/* ✅ 픽셀 편집기 라우트 */}
          <Route path="/pixel/edit/:token" element={<PixelEditor />} />

          {/* ✅ 구경하기 라우트 추가 */}
          <Route path="/view/:planet" element={<ViewPlanet />} />

          {/* ✅ 잘못된 경로 접근 시 홈으로 리디렉션 */}
          <Route path="*" element={<Navigate to="/" replace />} />

          {/* 토스 라우트*/}
          <Route path="/sandbox" element={<CheckoutPage />} />
          <Route path="/sandbox/success" element={<SuccessPage />} />
          <Route path="/sandbox/fail" element={<FailPage />} />


        </Routes>
    </AuthProvider>
  );
}
