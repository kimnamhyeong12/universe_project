// src/App.jsx

import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import SplashPage from "./pages/SplashPage.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import Universe from "./pages/Universe.jsx";
import MyPage from "./pages/mypage.jsx";
import MarketPage from "./pages/MarketPage.jsx";
import PixelEditor from "./pages/PixelEditor.jsx";
import ViewPlanet from "./pages/ViewPlanet.jsx";
import Modal from "./components/Modal.jsx";

import { CheckoutPage } from "./pages/Checkout.jsx";
import { SuccessPage } from "./pages/Success.jsx";
import { FailPage } from "./pages/Fail.jsx";

import WplaceEditor from "./pages/WplaceEditor.jsx";

import PointChargePage from "./pages/PointChargePage.jsx";
import CommunityHome from "./pages/community/CommunityHome.jsx";

import NFTmarket from "./pages/NFTmarket.jsx";
import NftVerify from "./pages/NftVerify";


// -----------------------------
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

// -----------------------------
export default function App() {
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const openLogin = () => setLoginOpen(true);
    window.addEventListener("celestia:open-login", openLogin);
    return () => window.removeEventListener("celestia:open-login", openLogin);
  }, []);

  return (
    <AuthProvider>
      <Modal title="로그인" isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* ❗ BrowserRouter 제거됨 (main.jsx에서 이미 감싸고 있음) */}
      <Routes>
        <Route path="/" element={<LandingShell />} />
        <Route path="/universe" element={<Universe />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/pixel/edit/:token" element={<PixelEditor />} />
        <Route path="/pixel/edit-nft/:nftId" element={<PixelEditor />} />  {/* ✅ 추가 */}
        <Route path="/view/:planet" element={<ViewPlanet />} />
        <Route path="/points/charge" element={<PointChargePage />} />
        <Route path="/community" element={<CommunityHome />} />
        <Route path="/nft/verify/:id" element={<NftVerify />} />



        {/* WPLACE Editor */}
        <Route path="/wplace/:planet" element={<WplaceEditor />} />

        {/* NFTmarket */}
        <Route path="/nftmarket" element={<NFTmarket />} />

        {/* Toss */}
        <Route path="/sandbox" element={<CheckoutPage />} />
        <Route path="/sandbox/success" element={<SuccessPage />} />
        <Route path="/sandbox/fail" element={<FailPage />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
