import React, { useState, useEffect, useContext, createContext } from "react";
import { jwtDecode } from "https://esm.sh/jwt-decode@4.0.0";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 앱 최초 실행 시 localStorage 복원
  useEffect(() => {
    const token = localStorage.getItem("celestia_token");
    if (token) {
      try {
        const decoded = jwtDecode(token);

        // ⭐ userId, jwt 저장 보완
        localStorage.setItem("userId", decoded.id);
        localStorage.setItem("jwt", token);

        setUser({
          username: decoded.username,
          email: decoded.email,
          id: decoded.id,
          token: token,
        });
      } catch (error) {
        console.error("토큰 해석 오류:", error);
        localStorage.removeItem("celestia_token");
        localStorage.removeItem("userId");
        localStorage.removeItem("jwt");
      }
    }
  }, []);

  // 로그인
  const login = async (email, password) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "로그인 실패");

      const { token } = data;
      localStorage.setItem("celestia_token", token);

      const decoded = jwtDecode(token);

      // ⭐ 여기 추가됨
      localStorage.setItem("userId", decoded.id);
      localStorage.setItem("jwt", token);

      setUser({
        username: decoded.username,
        email: decoded.email,
        id: decoded.id,
        token: token,
      });

      return { success: true };
    } catch (error) {
      console.error("로그인 API 오류:", error);
      return { success: false, message: error.message };
    }
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem("celestia_token");
    localStorage.removeItem("userId");     // ⭐ 추가됨
    localStorage.removeItem("jwt");        // ⭐ 추가됨
    setUser(null);
  };

  // 회원가입
  const register = async (username, email, password) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "회원가입 실패");
      }

      return { success: true, message: data.message || "회원가입 성공!" };
    } catch (error) {
      console.error("회원가입 API 오류:", error);
      return { success: false, message: error.message };
    }
  };

  const value = { user, login, logout, register };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
