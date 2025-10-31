import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
// =============================================================
// 6) Universe: 본 게임/앱 화면(추후 3D 우주 구현 예정)
//    - 로그인 여부에 따라 환영 문구 변경
// =============================================================
const Universe = () => {
  const auth = useAuth();

  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl">3D 우주 공간 (구현 예정)</h1>
      {auth.user ? (
        <p className="text-2xl mt-4 text-cyan-400">환영합니다, {auth.user.username}님!</p>
      ) : (
        <p className="text-2xl mt-4 text-red-500">로그인되지 않았습니다.</p>
      )}
    </div>
  );
};

export default Universe;