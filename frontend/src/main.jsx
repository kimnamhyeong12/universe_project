import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App.jsx";

// ✅ Toss 결제 관련 페이지 import
import { CheckoutPage } from "./pages/Checkout.jsx";
import { SuccessPage } from "./pages/Success.jsx";
import { FailPage } from "./pages/Fail.jsx";


// ✅ Toss 전용 CSS
import "./styles/style.css"; // Toss style.css는 styles 폴더에 넣을 거야

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* 기본 앱 라우트 */}
        <Route path="/*" element={<App />} />

        {/* ✅ Toss 결제 관련 라우트 */}
        <Route path="/sandbox" element={<CheckoutPage />} />
        <Route path="/sandbox/success" element={<SuccessPage />} />
        <Route path="/sandbox/fail" element={<FailPage />} />
      </Routes>
    </Router>
  </React.StrictMode>
);

