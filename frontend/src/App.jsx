    import React, { useState, useEffect, useRef } from 'react';

// --- (참고) Tailwind CSS 설정 ---
// (이전과 동일... `index.html`에 설정)


// --- 4. 모달(Modal) 컴포넌트 (업그레이드) ---
const Modal = ({ title, children, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity duration-300 animate-fadeIn"
            onClick={onClose}
        >
            {/* ★★★ '멋지게' 꾸미기 (1/3): 반투명 유리 + 글로우 효과 ★★★
                - bg-[#1a1a1a] (불투명) -> bg-slate-900/80 (반투명)
                - 'backdrop-blur-lg' 추가 (프로스티드 글래스 효과)
                - border-gray-700 -> border-cyan-500/30 (글로우 테두리)
                - shadow-lg shadow-cyan-500/10 -> shadow-2xl shadow-cyan-500/20 (그림자 강화)
            */}
            <div
                className="bg-slate-900/80 backdrop-blur-lg text-white w-11/12 max-w-2xl rounded-lg border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 p-8 relative transition-all duration-300 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    // ★★★ '멋지게' 꾸미기 (2/3): X버튼 호버 효과 변경 ★★★
                    className="absolute top-4 right-6 text-gray-400 hover:text-cyan-300 text-3xl font-bold transition-colors"
                    onClick={onClose}
                >
                    &times;
                </button>
                <h2 className="text-3xl font-bold text-cyan-300 border-b-2 border-cyan-300/50 pb-3 mb-6">
                    {title}
                </h2>
                <div className="text-lg leading-relaxed space-y-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- 1. 헤더(Header) 컴포넌트 ---
const MainHeader = ({ onModalOpen }) => {
// ... (이하 코드는 이전과 동일) ...
    return (
        <header className="fixed top-0 left-0 right-0 z-10 p-5 px-10 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
            <div className="text-2xl font-black tracking-wider text-white">CELESTIA</div>
            <nav className="hidden md:flex items-center space-x-6">
                <a href="#" className="text-gray-300 hover:text-white transition-colors" onClick={() => onModalOpen('about')}>CELESTIA 란?</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors" onClick={() => onModalOpen('guide')}>이용 가이드</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors" onClick={() => onModalOpen('gallery')}>갤러리</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors" onClick={() => onModalOpen('team')}>팀 소개</a>
            </nav>
            <div className="hidden md:block">
                <a 
                    href="#" 
                    className="font-bold border border-white text-white rounded-full px-5 py-2 text-sm hover:bg-white hover:text-black transition-all"
                    onClick={() => onModalOpen('login')}
                >
                    로그인
                </a>
            </div>
            <div className="md:hidden text-3xl cursor-pointer text-white">
                &#9776;
            </div>
        </header>
    );
};

// --- 2. 스플래시 페이지(Splash Page) 컴포넌트 ---
const SplashPage = ({ onEnter }) => {
    const [modalContent, setModalContent] = useState(null); 
    const openModal = (type) => setModalContent(type);
    const closeModal = () => setModalContent(null);

    return (
        <>
            <MainHeader onModalOpen={openModal} />
            
            <div className="w-screen h-screen relative flex items-center justify-center text-white overflow-hidden">
                
                {/* 1. 비디오 (z-[1]) */}
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
                
                {/* 2. 오버레이 (z-[2]) */}
                <div className="absolute inset-0 w-full h-full bg-black/60 z-[2]" />
                
                {/* 3. 중앙 콘텐츠 (z-[3]) */}
                <div className="relative z-[3] text-center animate-fadeIn">
                    <h1 className="text-7xl md:text-8xl font-black tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
                        CELESTIA
                    </h1>
                    <p className="text-xl md:text-2xl mt-4 mb-10 opacity-90">
                        나만의 우주를 소유하고, 창조하세요.
                    </p>
                    <button
                        className="text-lg font-bold uppercase tracking-wider bg-transparent border-2 border-white rounded-full px-12 py-4
                                   hover:bg-white hover:text-black hover:shadow-2xl hover:shadow-white/50 transition-all duration-300"
                        onClick={onEnter}
                    >
                        CELESTIA 입장하기
                    </button>
                </div>
            </div>

            {/* --- 모달들 (z-50) --- */}
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
            
            {/* ★★★ '멋지게' 꾸미기 (3/3): 로그인 폼 통일 ★★★
                - input의 bg-gray-700을 bg-slate-800/50 (반투명)으로 변경
            */}
            <Modal title="로그인" isOpen={modalContent === 'login'} onClose={closeModal}>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2" htmlFor="username">아이디</label>
                        <input className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70" id="username" type="text" placeholder="Username" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2" htmlFor="password">비밀번호</label>
                        <input className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70" id="password" type="password" placeholder="******************" />
                    </div>
                    <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300">
                        로그인
                    </button>
                    <a href="#" className="inline-block align-baseline font-bold text-sm text-cyan-400 hover:text-cyan-300">
                        회원가입
                    </a>
                </form>
            </Modal>
        </>
    );
};

// --- 3. 로딩 스크린(Loading Screen) 컴포넌트 ---
const LoadingScreen = () => {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white gap-6">
            <div className="w-16 h-16 border-4 border-t-white border-transparent rounded-full animate-spin" />
            <p className="text-2xl tracking-widest">Warp Drive Charging...</p>
        </div>
    );
};


// --- 5. 3D/2D 우주 앱 (Universe) 컴포넌트 ---
const Universe = () => {
    return (
        <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
            <h1 className="text-5xl">3D 우주 공간 (구현 예정)</h1>
            {/* 여기에 @react-three/fiber 의 <Canvas>가 들어옵니다. */}
        </div>
    );
};


// --- 최상위 App 컴포넌트 (모든 것을 제어) ---
export default function App() {
    const [view, setView] = useState('splash');

    const handleEnter = () => {
        setView('loading');
        setTimeout(() => {
            setView('app');
        }, 2000); // 2초 로딩 시뮬레이션
    };

    if (view === 'splash') {
        return <SplashPage onEnter={handleEnter} />;
    }

    if (view === 'loading') {
        return <LoadingScreen />;
    }

    if (view === 'app') {
        return <Universe />;
    }

    return null;
}

