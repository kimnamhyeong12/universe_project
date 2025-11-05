// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import SplashPage from "./pages/SplashPage.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import Universe from "./pages/Universe.jsx";
import MyPage from "./pages/MyPage.jsx";
import MarketPage from "./pages/MarketPage.jsx";

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingShell />} />
          <Route path="/universe" element={<Universe />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
