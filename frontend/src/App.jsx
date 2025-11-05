import React, { useState } from 'react';

// 1. "부품"들 import 하기
import { AuthProvider } from './context/AuthContext.jsx';
import SplashPage from './pages/SplashPage.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import Universe from './pages/Universe.jsx';
import Market from './pages/Market.jsx';

// 2. "최종 조립" (App 컴포넌트)
export default function App() {
  const [view, setView] = useState('splash'); // 'splash', 'loading', 'app', 'market'

  const handleEnter = () => {
    setView('loading');
    setTimeout(() => {
      setView('app');
    }, 2000); 
  };

  const goToMarket = () => {
    setView('market');
  };

  const goToUniverse = () => {
    setView('app');
  };

  return (
    // "로그인 보관함"이 모든 것을 감싼다
    <AuthProvider> 
      {/* view 상태에 따라 올바른 페이지만 보여준다 */}
      {view === 'splash' && <SplashPage onEnter={handleEnter} />}
      {view === 'loading' && <LoadingScreen />}
      {view === 'app' && <Universe onMarketClick={goToMarket} />}
      {view === 'market' && <Market onBackClick={goToUniverse} />}
    </AuthProvider>
  );
}
