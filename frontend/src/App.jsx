// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext.jsx';
import SplashPage from './pages/SplashPage.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import Universe from './pages/Universe.jsx';
import MyPage from './pages/MyPage.jsx';

// 스플래시 → 로딩 → 유니버스 전환만 담당하는 쉘
function LandingShell() {
  const [view, setView] = useState('splash'); // 'splash' | 'loading' | 'app'

  const handleEnter = () => {
    setView('loading');
    setTimeout(() => setView('app'), 1800);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.activeElement?.blur?.();
  }, [view]);

  return (
    <>
      {view === 'splash' && <SplashPage onEnter={handleEnter} />}
      {view === 'loading' && <LoadingScreen />}
      {view === 'app' && <Universe />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 홈(스플래시/스크롤 섹션/유니버스 진입) */}
          <Route path="/" element={<LandingShell />} />
          {/* 마이페이지는 완전 별도 화면 */}
          <Route path="/mypage" element={<MyPage />} />
          {/* 그 외 경로는 홈으로 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
