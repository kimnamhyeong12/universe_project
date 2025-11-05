import React from 'react';
// =============================================================
// 5) 로딩 화면: 간단한 스피너 + 문구
// =============================================================
const LoadingScreen = () => {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white gap-6">
      <div className="w-16 h-16 border-4 border-t-white border-transparent rounded-full animate-spin" />
      <p className="text-2xl tracking-widest">Warp Drive Charging...</p>
    </div>
  );
};

export default LoadingScreen;