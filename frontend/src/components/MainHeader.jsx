import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
// =============================================================
// 3) 상단 헤더: 네비게이션 + 로그인/로그아웃 버튼
// =============================================================
const MainHeader = ({ onModalOpen }) => {
  const auth = useAuth(); // user 상태에 따라 버튼 변경

  return (
    <header className="fixed top-0 left-0 right-0 z-10 p-5 px-10 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
      <div className="text-2xl font-black tracking-wider text-white">CELESTIA</div>
      <nav className="hidden md:flex items-center space-x-6">
        {/* 메뉴 클릭 시 해당 제목의 모달을 오픈 */}
        <a href="#" className="text-gray-300 hover:text-white transition-colors" onClick={() => onModalOpen('about')}>CELESTIA 란?</a>
        <a href="#" className="text-gray-300 hover:text-white transition-colors" onClick={() => onModalOpen('guide')}>이용 가이드</a>
        <a href="#" className="text-gray-300 hover:text-white transition-colors" onClick={() => onModalOpen('gallery')}>갤러리</a>
        <a href="#" className="text-gray-300 hover:text-white transition-colors" onClick={() => onModalOpen('team')}>팀 소개</a>
      </nav>
      <div className="hidden md:block">
        {auth.user ? (
          // 로그인 된 상태: 유저명 + 로그아웃
          <div className="flex items-center space-x-4">
            <span className="text-white font-bold">{auth.user.username}님</span>
            <a 
              href="#" 
              className="font-bold border border-gray-500 text-gray-300 rounded-full px-5 py-2 text-sm hover:bg-gray-700 hover:text-white transition-all"
              onClick={auth.logout}
            >
              로그아웃
            </a>
          </div>
        ) : (
          // 비로그인 상태: 로그인 버튼 → 로그인 모달 오픈
          <a 
            href="#" 
            className="font-bold border border-white text-white rounded-full px-5 py-2 text-sm hover:bg-white hover:text-black transition-all"
            onClick={() => onModalOpen('login')}
          >
            로그인
          </a>
        )}
      </div>
      {/* 모바일 메뉴 아이콘(추후 확장) */}
      <div className="md:hidden text-3xl cursor-pointer text-white">&#9776;</div>
    </header>
  );
};

export default MainHeader;