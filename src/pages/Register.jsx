// src/pages/Register.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import "./Register.css";
import hospitalHero from "../assets/hospital-hero.png";

export default function Register() {
  const query = new URLSearchParams(useLocation().search);
  const role = query.get("role") || "patient";
  const navigate = useNavigate();

  // --- states ---
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    // patient only
    birthDate: "",
    gender: "",
    address1: "",
    district: "",
    province: "",
    postalCode: "",
    // doctor only
    specialtyId: "",
  });

  const [specialties, setSpecialties] = useState([]);
  const [loadingSp, setLoadingSp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const API = useMemo(() => import.meta.env.VITE_API_URL?.replace(/\/+$/, ""), []);

  // โหลดสาขาเฉพาะตอนเป็นหมอ
  useEffect(() => {
    if (role !== "doctor") return;
    let aborted = false;

    async function loadSpecialties() {
      try {
        setLoadingSp(true);
        const res = await fetch(`${API}/api/specialties`);
        if (!res.ok) throw new Error(`โหลดสาขาไม่สำเร็จ (${res.status})`);
        const data = await res.json();
        if (!aborted) setSpecialties(data || []);
      } catch (e) {
        console.error(e);
        if (!aborted) setMsg("เกิดข้อผิดพลาดในการโหลดสาขาแพทย์");
      } finally {
        if (!aborted) setLoadingSp(false);
      }
    }

    loadSpecialties();
    return () => { aborted = true; };
  }, [API, role]);

  const onChange = (key) => (e) => {
    setForm((s) => ({ ...s, [key]: e.target.value }));
  };

  const validate = () => {
    if (form.password.length < 6) return "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร";
    if (form.password !== form.confirm) return "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน";
    if (role === "doctor" && !form.specialtyId) return "กรุณาเลือกสาขาความเชี่ยวชาญ";
    if (role === "patient") {
      if (!form.birthDate) return "กรุณาเลือกวันเกิด";
      if (!form.gender) return "กรุณาเลือกเพศ";
      if (!form.address1 || !form.district || !form.province || !form.postalCode) {
        return "กรุณากรอกที่อยู่ให้ครบถ้วน";
      }
      if (!/^\d{5}$/.test(form.postalCode)) return "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก";
    }
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    const v = validate();
    if (v) {
      setMsg(v);
      return;
    }

    // เตรียม payload
    const base = {
      role,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
    };

    let payload = base;
    if (role === "patient") {
      payload = {
        ...base,
        birthDate: form.birthDate,
        gender: form.gender,         // 'male' | 'female'
        address: {
          line1: form.address1.trim(),
          district: form.district.trim(),
          province: form.province.trim(),
          postalCode: form.postalCode.trim(),
        },
      };
    } else {
      payload = {
        ...base,
        specialtyId: Number(form.specialtyId),
      };
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await safeJson(res);
        const msg = err?.message || `สมัครไม่สำเร็จ (${res.status})`;
        throw new Error(msg);
      }

      setMsg("สมัครสมาชิกสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ…");
      // หน่วงสั้น ๆ ให้ผู้ใช้เห็นข้อความ แล้วค่อยพาไป login
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      console.error(err);
      setMsg(String(err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register">
      <div className="register__container">
        {/* ซ้าย */}
        <aside className="register__left">
          <div className="register__hero">
            <h2>ยินดีต้อนรับสู่ ClinicCare</h2>
            <p>ระบบจองนัดพบแพทย์และจัดการข้อมูลสุขภาพของคุณ</p>
          </div>
        </aside>

        {/* กลาง: การ์ดสมัคร */}
        <div className="register__card">
          <div className="register__brand">
            <span className="register__logo" aria-hidden="true">🌿</span>
            <h1>สมัครสมาชิก</h1>
          </div>

          <p className="register__subtitle">
            {role === "doctor" ? "สมัครเป็นแพทย์" : "สมัครเป็นคนไข้"}
          </p>

          {msg && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #c8e6c9",
                background: "#f1f8e9",
                color: "#1b5e20",
                fontSize: 14,
              }}
            >
              {msg}
            </div>
          )}

          <form className="register__form" onSubmit={submit}>
            {/* ชื่อ-นามสกุล */}
            <div className="form-group">
              <label>ชื่อ</label>
              <input
                type="text"
                placeholder="กรอกชื่อ"
                required
                value={form.firstName}
                onChange={onChange("firstName")}
              />
            </div>
            <div className="form-group">
              <label>นามสกุล</label>
              <input
                type="text"
                placeholder="กรอกนามสกุล"
                required
                value={form.lastName}
                onChange={onChange("lastName")}
              />
            </div>

            {/* อีเมล-เบอร์โทร */}
            <div className="form-group full">
              <label>อีเมล</label>
              <input
                type="email"
                placeholder="example@mail.com"
                required
                value={form.email}
                onChange={onChange("email")}
              />
            </div>
            <div className="form-group full">
              <label>เบอร์โทร</label>
              <input
                type="tel"
                placeholder="0812345678"
                required
                value={form.phone}
                onChange={onChange("phone")}
              />
            </div>

            {/* เฉพาะคนไข้: วันเกิด / เพศ + ที่อยู่ */}
            {role === "patient" && (
              <>
                <div className="form-group">
                  <label>วันเกิด</label>
                  <input
                    type="date"
                    required
                    value={form.birthDate}
                    onChange={onChange("birthDate")}
                  />
                </div>
                <div className="form-group">
                  <label>เพศ</label>
                  <select
                    required
                    value={form.gender}
                    onChange={onChange("gender")}
                  >
                    <option value="" disabled>-- เลือกเพศ --</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                  </select>
                </div>

                <div className="form-group full">
                  <label>ที่อยู่</label>
                  <input
                    type="text"
                    placeholder="เช่น 99/9 หมู่บ้านกรีนพาร์ค"
                    required
                    value={form.address1}
                    onChange={onChange("address1")}
                  />
                </div>
                <div className="form-group">
                  <label>เขต/อำเภอ</label>
                  <input
                    type="text"
                    placeholder="เช่น ลาดพร้าว"
                    required
                    value={form.district}
                    onChange={onChange("district")}
                  />
                </div>
                <div className="form-group">
                  <label>จังหวัด</label>
                  <input
                    type="text"
                    placeholder="เช่น กรุงเทพมหานคร"
                    required
                    value={form.province}
                    onChange={onChange("province")}
                  />
                </div>
                <div className="form-group">
                  <label>รหัสไปรษณีย์</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{5}"
                    placeholder="เช่น 10230"
                    title="กรอกรหัสไปรษณีย์ 5 หลัก"
                    required
                    value={form.postalCode}
                    onChange={onChange("postalCode")}
                  />
                </div>
              </>
            )}

            {/* เฉพาะหมอ: สาขาความเชี่ยวชาญ */}
            {role === "doctor" && (
              <div className="form-group full">
                <label>สาขาความเชี่ยวชาญ</label>
                <select
                  required
                  value={form.specialtyId}
                  onChange={onChange("specialtyId")}
                  disabled={loadingSp}
                >
                  <option value="" disabled>
                    {loadingSp ? "กำลังโหลด…" : "-- เลือกสาขา --"}
                  </option>
                  {specialties.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name_th || sp.name || sp.code}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* รหัสผ่าน */}
            <div className="form-group">
              <label>รหัสผ่าน</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={form.password}
                onChange={onChange("password")}
              />
            </div>
            <div className="form-group">
              <label>ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={form.confirm}
                onChange={onChange("confirm")}
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary full"
              disabled={submitting}
            >
              {submitting ? "กำลังสมัคร…" : "สมัครสมาชิก"}
            </button>
          </form>

          <p className="register__footer">
            มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
          </p>
        </div>

        {/* ขวา: รูปภาพ/แผง */}
        <aside className="register__rightPanel" aria-hidden="true">
          <img src={hospitalHero} alt="ClinicCare" className="register__image" />
        </aside>
      </div>
    </div>
  );
}

// helper: parse json safely
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
