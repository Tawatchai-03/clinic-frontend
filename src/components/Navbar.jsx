// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { getRole, isLoggedIn, clearAuth } from "../services/auth";
import "./Navbar.css";

export default function Navbar() {
  const nav = useNavigate();
  const loggedIn = isLoggedIn();
  const role = getRole(); // 'patient' | 'doctor' | null

  function RoleLanding() {
  const logged = isLoggedIn();
  const role = getRole();
  if (!logged) return <Navigate to="/" replace />; // หน้าบ้านเดิมถ้ายังไม่ล็อกอิน
  return <Navigate to={role === "doctor" ? "/doctor" : "/search"} replace />;
}
  const logout = () => {
    clearAuth();
    nav("/", { replace: true });
  };

  // ปลายทางของโลโก้
  const homeDest = !loggedIn ? "/" : role === "doctor" ? "/doctor" : "/search";

  return (
    <nav
      className="nav"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "10px 16px",
        background: "linear-gradient(135deg, #e8f5e9cc, #c8e6c9cc)",
        borderBottom: "1px solid #e0f2e9",
      }}
    >
      {/* โลโก้ → ไปหน้าตามบทบาท */}
      <Link
        to={homeDest}
        style={{ textDecoration: "none", color: "#1b5e20", fontWeight: 700 }}
        aria-label="ClinicCare Home"
      >
        🌿 ClinicCare
      </Link>

      <div style={{ display: "flex", gap: 10 }}>
        {!loggedIn && (
          <>
            <Link to="/login" className="nav__link">เข้าสู่ระบบ</Link>
            <Link to="/register?role=patient" className="nav__link">สมัครคนไข้</Link>
            <Link to="/register?role=doctor" className="nav__link">สมัครหมอ</Link>
          </>
        )}

        {loggedIn && role === "patient" && (
          <>
            <Link to="/search" className="nav__link">ค้นหาแพทย์</Link>
            <Link to="/my-appointments" className="nav__link">นัดของฉัน</Link>
            <Link to="/profile" className="nav__link">โปรไฟล์</Link>
            <button onClick={logout} className="btn btn--ghost">ออกจากระบบ</button>
          </>
        )}

        {loggedIn && role === "doctor" && (
          <>
            <Link to="/doctor" className="nav__link">จัดตารางนัด</Link>
            <Link to="/profile" className="nav__link">โปรไฟล์</Link>
            <button onClick={logout} className="btn btn--ghost">ออกจากระบบ</button>
          </>
        )}
      </div>
    </nav>
  );
}
