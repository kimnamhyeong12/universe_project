import React, { useState, useEffect, useRef, createContext, useContext } from 'react';

// --- (참고) Tailwind CSS 설정 ---
// 이 코드는 CDN 방식 (index.html에 <script> 태그)으로 작동합니다.
// 로컬 설치 방식(postcss.config.js 등)으로 되돌리려면
// 1. 이 파일의 "1. AuthContext 영역" 하단의 `jwt-decode` 설치
// 2. index.html의 CDN 스크립트 제거
// 3. main.jsx의 `index.css` 임포트 복구
// 4. "npm install"로 Tailwind 4대장 + jwt-decode 설치
// 5. "postcss.config.cjs" 파일명 복구
// ...등의 작업이 필요합니다. (지금은 CDN 방식으로 둡니다)

// --- 1. AuthContext 영역 ---
// 백엔드에서 받은 JWT(토큰)을 파싱(해석)해서 사용자 이름을 꺼내는 라이브러리
// ★★★ 변경점: npm install 대신 CDN에서 직접 불러오도록 수정 ★★★
// 이 기능은 CDN(esm.sh)에서 'jwt-decode'를 직접 불러옵니다.
// 별도의 "npm install jwt-decode"가 필요하지 않습니다.
import { jwtDecode } from 'https://esm.sh/jwt-decode@4.0.0';

// 1-1. 전역 보관함(Context) 생성
const AuthContext = createContext();

// 1-2. Context를 사용하기 위한 헬퍼 함수
// (컴포넌트에서 const auth = useAuth() 로 쉽게 불러올 수 있게 함)
export const useAuth = () => {
  return useContext(AuthContext);
};

// 1-3. 전역 보관함을 제공하는 "Provider" 컴포넌트
// (App 전체를 감싸서, 모든 자식 컴포넌트가 로그인 상태를 공유하게 함)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // 'null'이면 비로그인 상태

  // 1-4. 앱이 처음 로드될 때(새로고침 시) localStorage 확인
  useEffect(() => {
    const token = localStorage.getItem('celestia_token');
    if (token) {
      try {
        const decoded = jwtDecode(token); // 토큰 해석
        // ★★★ 백엔드와 협의 필요 ★★★
        // 팀장님 백엔드(server.js)의 JWT 생성 로직(image_aff355.jpg)을 보니
        // { id: user.id, username: user.username, email: user.email }
        // 이렇게 3가지 정보를 토큰에 담고 있었습니다.
        setUser({ 
          username: decoded.username, 
          email: decoded.email,
          id: decoded.id,
          token: token 
        });
      } catch (error) {
        console.error("토큰 해석 오류:", error);
        localStorage.removeItem('celestia_token'); // 잘못된 토큰 삭제
      }
    }
  }, []);

  // 1-5. 로그인 함수 (백엔드와 통신)
  const login = async (username, password) => {
    try {
      // ★★★ 백엔드와 협의 필요 (포트/주소) ★★★
      // 팀장님 서버 포트가 8829이고, 주소가 /login 인 것을 기준으로 합니다.
      const response = await fetch('http://localhost:8829/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 서버에서 보낸 에러 메시지 (예: "Wrong password")
        throw new Error(data.error || '로그인 실패');
      }
      
      // 로그인이 성공하면 (예: { message: "Login success", token: "..." })
      const { token } = data;
      localStorage.setItem('celestia_token', token); // 토큰을 브라우저에 저장
      
      const decoded = jwtDecode(token); // 토큰 해석
      setUser({ 
        username: decoded.username, 
        email: decoded.email,
        id: decoded.id,
        token: token 
      });

      return { success: true };

    } catch (error) {
      console.error("로그인 API 오류:", error);
      return { success: false, message: error.message };
    }
  };

  // 1-6. 로그아웃 함수
  const logout = () => {
    localStorage.removeItem('celestia_token');
    setUser(null);
  };

  // 1-7. 보관함에 담을 "값"들
  const value = {
    user, // 현재 유저 정보 (null 혹은 객체)
    login, // 로그인 함수
    logout, // 로그아웃 함수
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- 4. 모달(Modal) 컴포넌트 (업그레이드) ---
// (이전과 동일... loginForm 로직만 추가됨)
const Modal = ({ title, children, isOpen, onClose }) => {
  const auth = useAuth(); // 전역 보관함 사용!
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(''); // 이전 에러 초기화
    
    const result = await auth.login(username, password);
    
    if (result.success) {
      onClose(); // 로그인 성공 시 모달 닫기
    } else {
      setError(result.message || '아이디 또는 비밀번호가 잘못되었습니다.');
    }
  };
  
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity duration-300 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900/80 backdrop-blur-lg text-white w-11/12 max-w-2xl rounded-lg border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 p-8 relative transition-all duration-300 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-6 text-gray-400 hover:text-cyan-300 text-3xl font-bold transition-colors"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold text-cyan-300 border-b-2 border-cyan-300/50 pb-3 mb-6">
          {title}
        </h2>
        <div className="text-lg leading-relaxed space-y-4">
          {/* "로그인" 모달일 경우에만 로그인 폼을 렌더링 */}
          {title === '로그인' ? (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              {error && (
                <p className="text-red-400 bg-red-900/50 p-3 rounded text-center">{error}</p>
              )}
              <div>
                <label className="block text-sm font-bold mb-2" htmlFor="username">아이디</label>
                <input 
                  className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70" 
                  id="username" 
                  type="text" 
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" htmlFor="password">비밀번호</label>
                <input 
                  className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70" 
                  id="password" 
                  type="password" 
                  placeholder="******************" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300">
                로그인
              </button>
              <a href="#" className="inline-block align-baseline font-bold text-sm text-cyan-400 hover:text-cyan-300">
                회원가입
              </a>
            </form>
          ) : (
            // 다른 모달들은 원래 내용을 그대로 렌더링
            children
          )}
        </div>
      </div>
    </div>
  );
};

// --- 1. 헤더(Header) 컴포넌트 ---
const MainHeader = ({ onModalOpen }) => {
  const auth = useAuth(); // 전역 보관함 사용!

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
        {/* ★★★ 변경점: 로그인 상태에 따라 UI 변경 ★★★ */}
        {auth.user ? (
          // 1. 로그인 된 상태
          <div className="flex items-center space-x-4">
            <span className="text-white font-bold">
              {auth.user.username}님
            </span>
            <a 
              href="#" 
              className="font-bold border border-gray-500 text-gray-300 rounded-full px-5 py-2 text-sm hover:bg-gray-700 hover:text-white transition-all"
              onClick={auth.logout}
            >
              로그아웃
            </a>
          </div>
        ) : (
          // 2. 로그인 안 된 상태 (기존 코드)
          <a 
            href="#" 
            className="font-bold border border-white text-white rounded-full px-5 py-2 text-sm hover:bg-white hover:text-black transition-all"
            onClick={() => onModalOpen('login')}
          >
            로그인
          </a>
        )}
      </div>
      <div className="md:hidden text-3xl cursor-pointer text-white">
        &#9776;
      </div>
    </header>
  );
};

// --- 2. 스플래시 페이지(Splash Page) 컴포넌트 ---
const SplashPage = ({ onEnter }) => {
  // (이전과 동일... `auth`는 헤더와 모달이 알아서 쓰므로 여기엔 필요 X)
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
          {/* 비디오 파일은 "frontend/public/celestia_bg.mp4" 에 있어야 합니다 */}
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
      
      {/* "로그인" 모달은 이제 title === '로그인' 분기 로직에 의해
        자동으로 폼을 포함하게 되므로, children을 넘겨줄 필요가 없습니다.
      */}
      <Modal title="로그인" isOpen={modalContent === 'login'} onClose={closeModal} />
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
  const auth = useAuth(); // 전역 보관함 사용!

  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl">3D 우주 공간 (구현 예정)</h1>
      
      {/* 로그인된 유저 이름 보여주기 (테스트용) */}
      {auth.user ? (
        <p className="text-2xl mt-4 text-cyan-400">환영합니다, {auth.user.username}님!</p>
      ) : (
        <p className="text-2xl mt-4 text-red-500">로그인되지 않았습니다.</p>
      )}
      
      {/* 여기에 @react-three/fiber 의 <Canvas>가 들어옵니다. */}
    </div>
  );
};


// --- 2. 최상위 App 컴포넌트 (모든 것을 제어) ---
export default function App() {
  const [view, setView] = useState('splash');

  const handleEnter = () => {
    setView('loading');
    setTimeout(() => {
      setView('app');
    }, 2000); // 2초 로딩 시뮬레이션
  };

  // ★★★ 변경점: App 전체를 AuthProvider로 감싸기 ★★★
  return (
    <AuthProvider>
      {/* AuthProvider가 "전역 보관함"을 제공하므로,
        이제 SplashPage, LoadingScreen, Universe 컴포넌트와
        그 모든 자식들(MainHeader, Modal 등)은
        useAuth() 훅을 통해 로그인 상태를 공유할 수 있습니다.
      */}
      {view === 'splash' && <SplashPage onEnter={handleEnter} />}
      {view === 'loading' && <LoadingScreen />}
      {view === 'app' && <Universe />}
    </AuthProvider>
  );
}

