import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// 'src/index.css'를 import하는 라인을 "삭제"합니다.
// (Tailwind는 이제 index.html의 CDN 스크립트가 관리합니다.)
// import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

