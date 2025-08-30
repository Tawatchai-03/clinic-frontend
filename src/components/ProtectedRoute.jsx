// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const role = localStorage.getItem("auth_role"); // "patient" | "doctor" | null

  if (!role) {
    alert("กรุณาเข้าสู่ระบบหรือสมัครสมาชิกเพื่อใช้งาน");
    return <Navigate to="/" replace />;
  }

  return children;
}
