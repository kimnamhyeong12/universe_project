import React, { useState } from 'react'; 
import { useAuth } from '../context/AuthContext';

// =============================================================
// Modal 컴포넌트: 로그인/회원가입 전용 모달 + 일반 모달 공용
// =============================================================
const Modal = ({ title, children, isOpen, onClose }) => {
  const auth = useAuth();

  // 상태값
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 모달 닫기
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

  // ✅ 로그인 처리
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const result = await auth.login(email, password);
    if (result.success) {
      handleClose();
    } else {
      setError(result.message || '아이디 또는 비밀번호가 잘못되었습니다.');
    }
  };

  // ✅ 회원가입 처리
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자리 이상이어야 합니다.');
      return;
    }

    const result = await auth.register(username, email, password);
    if (result.success) {
      setSuccess('회원가입에 성공했습니다! 이제 로그인해주세요.');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setIsRegisterView(false);
    } else {
      setError(result.message || '회원가입에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  // 🔐 로그인 / 회원가입 모달
  if (title === '로그인') {
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
            {isRegisterView ? '회원가입' : '로그인'}
          </h2>

          <div className="text-lg leading-relaxed space-y-4">
            {error && (<p className="text-red-400 bg-red-900/50 p-3 rounded text-center">{error}</p>)}
            {success && (<p className="text-green-400 bg-green-900/50 p-3 rounded text-center">{success}</p>)}

            {isRegisterView ? (
              // ------------------------------
              // ✅ 회원가입 폼
              // ------------------------------
              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="reg-username">사용자 이름 (Username)</label>
                  <input
                    className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70"
                    id="reg-username"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="reg-email">이메일 (Email)</label>
                  <input
                    className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70"
                    id="reg-email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="reg-password">비밀번호</label>
                  <input
                    className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70"
                    id="reg-password"
                    type="password"
                    placeholder="6자리 이상"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="reg-confirm-password">비밀번호 확인</label>
                  <input
                    className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70"
                    id="reg-confirm-password"
                    type="password"
                    placeholder="비밀번호 재입력"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
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
              // 🔓 로그인 폼 (수정 완료)
              // ------------------------------
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div> 
                  <label className="block text-sm font-bold mb-2" htmlFor="email">이메일</label>
                  <input
                    className="w-full p-3 rounded bg-slate-800/50 border border-gray-600 focus:border-cyan-500 focus:outline-none focus:bg-slate-700/70"
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                    required
                  />
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

  // 📄 일반 정보 모달
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
