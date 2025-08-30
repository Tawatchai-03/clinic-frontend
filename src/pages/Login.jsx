// src/pages/Login.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setAuth } from "../services/auth";
import "./Login.css";
import hospitalHero from "../assets/hospital-hero.png";

export default function Login() {
  const API = useMemo(() => import.meta.env.VITE_API_URL?.replace(/\/+$/, ""), []);
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "เข้าสู่ระบบไม่สำเร็จ");

      // เซฟสถานะล็อกอิน (ไม่มี token ก็เว้นว่างไว้ได้)
      setAuth(data);

      // พาไปหน้าเหมาะกับ role
      if (data.role === "doctor") {
        nav("/doctor", { replace: true });
      } else {
        nav("/search", { replace: true });
      }
    } catch (err) {
      setMsg(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <div className="login__container">
        <aside className="login__left">
          <div className="login__hero">
            <h2>ยินดีต้อนรับกลับมา 👋</h2>
            <p>เข้าสู่ระบบเพื่อจองนัด พบแพทย์ และจัดการข้อมูลสุขภาพของคุณ</p>
          </div>
        </aside>

        <div className="login__card">
          <div className="login__brand">
            <span className="login__logo" aria-hidden="true">🌿</span>
            <h1>เข้าสู่ระบบ</h1>
          </div>

          {msg && (
            <div style={{
              marginBottom:12,padding:"10px 12px",borderRadius:10,
              border:"1px solid #c8e6c9",background:"#f1f8e9",color:"#1b5e20"
            }}>{msg}</div>
          )}

          <form className="login__form" onSubmit={submit}>
            <div className="form-group full">
              <label>อีเมล</label>
              <input
                type="email"
                placeholder="example@mail.com"
                required
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />
            </div>

            <div className="form-group full">
              <label>รหัสผ่าน</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn--primary full" disabled={loading}>
              {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p className="login__footer">
            ยังไม่มีบัญชี? <Link to="/register?role=patient">สมัครเป็นคนไข้</Link> |{" "}
            <Link to="/register?role=doctor">สมัครเป็นหมอ</Link>
          </p>
        </div>

        <aside className="login__rightPanel" aria-hidden="true">
          <img src={hospitalHero} alt="ClinicCare" className="login__image" />
        </aside>
      </div>
    </div>
  );
}
