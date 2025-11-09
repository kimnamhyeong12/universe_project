// src/App.jsx

// ✅ [추가] useEffect, useState 임포트
import React, { useEffect, useState } from "react"; 
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import SplashPage from "./pages/SplashPage.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import Universe from "./pages/Universe.jsx";
import MyPage from "./pages/mypage.jsx";
import MarketPage from "./pages/MarketPage.jsx";
import PixelEditor from "./pages/PixelEditor.jsx";
import ViewPlanet from "./pages/ViewPlanet.jsx"; 

// ✅ [추가] Modal 컴포넌트 임포트
import Modal from "./components/Modal.jsx"; 

// Toss
import { CheckoutPage } from "./pages/Checkout";
import { SuccessPage } from "./pages/Success";
import { FailPage } from "./pages/Fail";



function LandingShell() {
  // ... (이 부분은 수정 없음) ...
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
  
  // ✅ [추가] SplashPage에서 가져온 로그인 모달 상태
  const [loginOpen, setLoginOpen] = useState(false);

  // ✅ [추가] SplashPage에서 가져온 로그인 이벤트 리스너
  useEffect(() => {
    const open = () => setLoginOpen(true);
    window.addEventListener("celestia:open-login", open);
    return () => window.removeEventListener("celestia:open-login", open);
  }, []);

  return (
    <AuthProvider>
      
      {/* ✅ [추가] Routes 밖에 Modal을 배치하여 전역으로 사용 */}
      <Modal title="로그인" isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      <Routes>
        <Route path="/" element={<LandingShell />} />
        <Route path="/universe" element={<Universe />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/pixel/edit/:token" element={<PixelEditor />} />
        <Route path="/view/:planet" element={<ViewPlanet />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/sandbox" element={<CheckoutPage />} />
        <Route path="/sandbox/success" element={<SuccessPage />} />
        <Route path="/sandbox/fail" element={<FailPage />} />
      </Routes>

    </AuthProvider>
  );
}