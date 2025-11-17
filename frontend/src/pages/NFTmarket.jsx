// ✅ src/pages/MarketPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Market.css";
import PurchasePanel from "../components/PurchasePanel";
import Modal from "../components/Modal"; // ✅ 기존 Modal 재활용
import AppHeader from "../components/AppHeader";

export default function NFTmarket() {
    
}
