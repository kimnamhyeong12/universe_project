import React, { useState } from 'react'; 
import { useAuth } from '../context/AuthContext';
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


export default Modal; 