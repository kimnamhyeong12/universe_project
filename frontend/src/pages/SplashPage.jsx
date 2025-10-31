import React, { useState } from 'react';
import MainHeader from '../components/MainHeader.jsx';
import Modal from '../components/Modal.jsx';
// =============================================================
// 4) 스플래시 페이지: 배경 영상 + 모달 관리
// =============================================================
const SplashPage = ({ onEnter }) => {
  const [modalContent, setModalContent] = useState(null); // 어떤 모달을 띄울지 상태 관리
  const openModal = (type) => setModalContent(type);
  const closeModal = () => setModalContent(null);

  return (
    <>
      <MainHeader onModalOpen={openModal} />

      {/* 상단 큰 배경 (비디오) */}
      <div className="w-screen h-screen relative flex items-center justify-center text-white overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-[1]"
        >
          <source src="/celestia_bg.mp4" type="video/mp4" />
          브라우저가 비디오 태그를 지원하지 않습니다.
        </video>
        <div className="absolute inset-0 w-full h-full bg-black/60 z-[2]" />

        {/* 중앙 타이틀/버튼 */}
        <div className="relative z-[3] text-center animate-fadeIn">
          <h1 className="text-7xl md:text-8xl font-black tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
            CELESTIA
          </h1>
          <p className="text-xl md:text-2xl mt-4 mb-10 opacity-90">나만의 우주를 소유하고, 창조하세요.</p>
          <button
            className="text-lg font-bold uppercase tracking-wider bg-transparent border-2 border-white rounded-full px-12 py-4 hover:bg-white hover:text-black hover:shadow-2xl hover:shadow-white/50 transition-all duration-300"
            onClick={onEnter} // 클릭 시 다음 화면으로 이동(로딩 → 앱)
          >
            CELESTIA 입장하기
          </button>
        </div>
      </div>

      {/* 모달들: title에 따라 내용 변경 */}
      <Modal title="CELESTIA 란?" isOpen={modalContent === 'about'} onClose={closeModal}>
        <p>CELESTIA는 가상의 우주 공간 속에서 자신만의 영역을 소유하고 표현하려는 현대인의 욕구를 충족시키기 위해 탄생했습니다.</p>
        <p>기존의 상징적 소유(루나엠버시)나 단순 창작(WPLACE)을 넘어, <strong>소유와 창작을 결합</strong>한 인터랙티브 경험을 제공합니다. 여러분은 디지털 우주 속 행성의 특정 구역을 구매하고, 해당 영역에 직접 픽셀 아트를 제작하여 자신을 표현할 수 있습니다.</p>
      </Modal>

      <Modal title="이용 가이드" isOpen={modalContent === 'guide'} onClose={closeModal}>
        <ul className="list-none space-y-4">
          <li><strong className="text-cyan-300 block text-xl">1단계: 우주 탐험</strong>[CELESTIA 입장하기]를 눌러 3D 우주 공간을 탐험합니다.</li>
          <li><strong className="text-cyan-300 block text-xl">2단계: 행성 선택 및 구역 구매</strong>"창작의 행성"을 찾아 착륙(줌인)하고, 원하는 픽셀 구역을 선택하여 자신만의 영토로 만듭니다.</li>
          <li><strong className="text-cyan-300 block text-xl">3단계: 픽셀 아트 창작</strong>구매한 영토에 픽셀 에디터를 사용하여 자유롭게 자신만의 예술 작품을 창조하고 전시합니다.</li>
        </ul>
      </Modal>

      <Modal title="갤러리" isOpen={modalContent === 'gallery'} onClose={closeModal}>
        <p>현재 다른 창조자들이 만든 멋진 픽셀 아트 작품들을 준비 중입니다. (추후 기능 구현)</p>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-700/50 h-32 rounded animate-pulse"></div>
          <div className="bg-slate-700/50 h-32 rounded animate-pulse"></div>
          <div className="bg-slate-700/50 h-32 rounded animate-pulse"></div>
        </div>
      </Modal>

      <Modal title="팀 소개" isOpen={modalContent === 'team'} onClose={closeModal}>
        <p>저희는 동아대학교 SW중심대학사업 D-Lab 소속 CELESTIA 팀입니다.</p>
        <ul className="list-none space-y-2 mt-4">
          <li><b>팀장 (기관 참여):</b> 김남형</li>
          <li><b>프론트엔드:</b> 조영준</li>
          <li><b>백엔드:</b> 정권호</li>
          <li><b>백엔드:</b> 모준호</li>
        </ul>
      </Modal>

      {/* 로그인/회원가입 모달 */}
      <Modal title="로그인" isOpen={modalContent === 'login'} onClose={closeModal} />
    </>
  );
};


export default SplashPage;