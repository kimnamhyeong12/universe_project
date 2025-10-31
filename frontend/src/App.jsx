import React, { useState, useEffect, useRef, createContext, useContext } from 'react';

// =============================================================
// 📌 이 파일은 CDN 방식( index.html에 <script> )으로 구동되는 React 코드입니다.
//     - jwt-decode 라이브러리는 esm.sh CDN으로 불러옵니다. (npm 설치 X)
//     - 로그인/회원가입은 로컬 백엔드( http://localhost:8829 )와 통신합니다.
// =============================================================

import { jwtDecode } from 'https://esm.sh/jwt-decode@4.0.0';

// =============================================================
// 1) AuthContext: 전역 인증 상태(로그인 유저 정보 등)를 보관하는 컨텍스트
//    - 어디서든 useAuth()로 user, login(), logout(), register() 사용 가능
// =============================================================
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // 현재 로그인한 사용자 정보 (없으면 null)

  // 앱이 처음 렌더링될 때, localStorage에 저장된 토큰이 있으면 자동 로그인 시도
  useEffect(() => {
    const token = localStorage.getItem('celestia_token');
    if (token) {
      try {
        const decoded = jwtDecode(token); // 토큰 내부 정보(유저 id/이메일 등) 추출
        setUser({ 
          username: decoded.username, 
          email: decoded.email,
          id: decoded.id,
          token: token 
        });
      } catch (error) {
        console.error('토큰 해석 오류:', error);
        localStorage.removeItem('celestia_token'); // 깨진 토큰이면 제거
      }
    }
  }, []);

  // 로그인: 백엔드 /login 호출 → 성공 시 토큰 저장 + user 세팅
  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:8829/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '로그인 실패');

      const { token } = data;
      localStorage.setItem('celestia_token', token); // 새 토큰 저장
      const decoded = jwtDecode(token);
      setUser({ 
        username: decoded.username, 
        email: decoded.email,
        id: decoded.id,
        token: token 
      });
      return { success: true };
    } catch (error) {
      console.error('로그인 API 오류:', error);
      return { success: false, message: error.message };
    }
  };

  // 로그아웃: 토큰 삭제 + user 초기화
  const logout = () => {
    localStorage.removeItem('celestia_token');
    setUser(null);
  };

  // 회원가입: 백엔드 /register 호출 → 성공/실패 메시지 반환
  const register = async (username, email, password) => {
    try {
      const response = await fetch('http://localhost:8829/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        // 예: { error: 'Username already exists' }
        throw new Error(data.error || '회원가입 실패');
      }

      // 성공 시에는 보통 바로 로그인시키거나 안내 메시지를 보여줌
      return { success: true, message: data.message || '회원가입 성공!' };
    } catch (error) {
      console.error('회원가입 API 오류:', error);
      return { success: false, message: error.message };
    }
  };

  // 컨텍스트로 내보낼 값들
  const value = { user, login, logout, register };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// =============================================================
// 2) Modal 컴포넌트: 공용 모달 + 로그인/회원가입 전용 UI 포함
//    - title이 '로그인'일 때: 로그인/회원가입 폼 전환 렌더링
//    - 그 외 제목: 일반 내용 모달로 동작
// =============================================================
const Modal = ({ title, children, isOpen, onClose }) => {
  const auth = useAuth(); // 로그인/회원가입 함수 사용을 위해 컨텍스트 접근

  // 로그인/회원가입 전용 상태들
  const [isRegisterView, setIsRegisterView] = useState(false); // 로그인 ↔ 회원가입 폼 토글
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // 회원가입용
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // 회원가입용

  const [error, setError] = useState('');   // 에러 메시지 출력용
  const [success, setSuccess] = useState(''); // 성공 메시지 출력용

  // 모달 닫기 시, 입력값/메시지 초기화
  const handleClose = () => {
    setIsRegisterView(false);
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    onClose();
  };

  // 로그인 폼 제출 처리
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const result = await auth.login(username, password);
    if (result.success) {
      handleClose(); // 로그인 성공 → 모달 닫기
    } else {
      setError(result.message || '아이디 또는 비밀번호가 잘못되었습니다.');
    }
  };

  // 회원가입 폼 제출 처리
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // (프론트) 간단 유효성 검사
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자리 이상이어야 합니다.');
      return;
    }

    // 실제 회원가입 요청
    const result = await auth.register(username, email, password);
    if (result.success) {
      setSuccess('회원가입에 성공했습니다! 이제 로그인해주세요.');
      // 입력값 초기화 + 로그인 화면으로 전환
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setIsRegisterView(false);
    } else {
      setError(result.message || '회원가입에 실패했습니다.');
    }
  };

  // isOpen이 false면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  // 🔐 로그인 전용 모달 (로그인/회원가입 토글)
  if (title === '로그인') {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity duration-300 animate-fadeIn"
        onClick={handleClose} // 배경 클릭 시 닫기
      >
        <div
          className="bg-slate-900/80 backdrop-blur-lg text-white w-11/12 max-w-2xl rounded-lg border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 p-8 relative transition-all duration-300 animate-scaleIn"
          onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫힘 방지
        >
          <button
            className="absolute top-4 right-6 text-gray-400 hover:text-cyan-300 text-3xl font-bold transition-colors"
            onClick={handleClose}
          >
            &times;
          </button>

          {/* 제목: 현재 뷰 상태에 맞게 */}
          <h2 className="text-3xl font-bold text-cyan-300 border-b-2 border-cyan-300/50 pb-3 mb-6">
            {isRegisterView ? '회원가입' : '로그인'}
          </h2>

          <div className="text-lg leading-relaxed space-y-4">
            {/* 공통 에러/성공 메시지 표시 */}
            {error && (<p className="text-red-400 bg-red-900/50 p-3 rounded text-center">{error}</p>)}
            {success && (<p className="text-green-400 bg-green-900/50 p-3 rounded text-center">{success}</p>)}

            {isRegisterView ? (
              // ------------------------------
              // ✅ 회원가입 폼
              // ------------------------------
              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="reg-username">아이디 (Username)</label>
                  <input className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70" id="reg-username" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="reg-email">이메일 (Email)</label>
                  <input className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70" id="reg-email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="reg-password">비밀번호</label>
                  <input className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70" id="reg-password" type="password" placeholder="6자리 이상" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="reg-confirm-password">비밀번호 확인</label>
                  <input className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70" id="reg-confirm-password" type="password" placeholder="비밀번호 재입력" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300">
                  회원가입
                </button>
                <a 
                  href="#" 
                  className="inline-block align-baseline font-bold text-sm text-cyan-400 hover:text-cyan-300"
                  onClick={() => {
                    setIsRegisterView(false);
                    setError('');
                    setSuccess('');
                  }}
                >
                  &larr; 로그인으로 돌아가기
                </a>
              </form>
            ) : (
              // ------------------------------
              // 🔓 로그인 폼
              // ------------------------------
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="username">아이디</label>
                  <input className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70" id="username" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="password">비밀번호</label>
                  <input className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70" id="password" type="password" placeholder="******************" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300">
                  로그인
                </button>
                <a 
                  href="#" 
                  className="inline-block align-baseline font-bold text-sm text-cyan-400 hover:text-cyan-300"
                  onClick={() => {
                    setIsRegisterView(true);
                    setError('');
                    setSuccess('');
                  }}
                >
                  계정이 없으신가요? 회원가입
                </a>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 📄 일반 정보 모달 ("CELESTIA 란?", "이용 가이드" 등)
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity duration-300 animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="bg-slate-900/80 backdrop-blur-lg text-white w-11/12 max-w-2xl rounded-lg border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 p-8 relative transition-all duration-300 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-6 text-gray-400 hover:text-cyan-300 text-3xl font-bold transition-colors"
          onClick={handleClose}
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

// =============================================================
// 7) App (최상위): 스플래시 → 로딩 → 앱 화면 전환 관리
// =============================================================
export default function App() {
  const [view, setView] = useState('splash'); // 현재 화면 상태: 'splash' | 'loading' | 'app'

  // "CELESTIA 입장하기" 버튼 클릭 시 호출
  const handleEnter = () => {
    setView('loading');
    // 간단한 로딩 시뮬레이션(2초 뒤 실제 앱 화면으로 이동)
    setTimeout(() => {
      setView('app');
    }, 2000);
  };

  return (
    // 전체 앱을 AuthProvider로 감싸서 어디서든 인증 상태 사용 가능
    <AuthProvider>
      {view === 'splash' && <SplashPage onEnter={handleEnter} />}
      {view === 'loading' && <LoadingScreen />}
      {view === 'app' && <Universe />}
    </AuthProvider>
  );
}
