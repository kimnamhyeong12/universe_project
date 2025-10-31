import React, { useState, useEffect, useContext, createContext } from 'react';
// =============================================================
// 1) AuthContext: 전역 인증 상태(로그인 유저 정보 등)를 보관하는 컨텍스트
//    - 어디서든 useAuth()로 user, login(), logout(), register() 사용 가능
// =============================================================


import { jwtDecode } from 'https://esm.sh/jwt-decode@4.0.0';

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
      const response = await fetch('http://localhost:5000/login', {
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
      const response = await fetch('http://localhost:5000/register', {
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
