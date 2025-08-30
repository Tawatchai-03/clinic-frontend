// src/pages/Profile.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./Profile.css";

export default function Profile() {
  // อ่านผู้ใช้จาก localStorage หลังล็อกอิน (ตั้งโดย /api/login)
  const auth = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("auth_user") || "{}"); }
    catch { return {}; }
  }, []);
  const userId = auth?.id;
  const role = (auth?.role === "doctor") ? "doctor" : "patient"; // fallback
  const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

  const [tab, setTab] = useState("info");
  const [data, setData] = useState(null);        // ข้อมูลโปรไฟล์จากแบ็กเอนด์
  const [serverRole, setServerRole] = useState(null); // ใช้ role ที่แบ็กเอนด์ส่งมา
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const fileRef = useRef(null);

  // ---------- state สำหรับ "เปลี่ยนรหัสผ่าน"
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const onPwChange = (k) => (e) => setPw((p) => ({ ...p, [k]: e.target.value }));

  // โหลดโปรไฟล์จริง
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const res = await fetch(`${API}/api/users/${userId}`);
      if (!res.ok) throw new Error(`load profile failed (${res.status})`);
      const json = await res.json();

      // ✅ บังคับให้ birthDate เป็น "YYYY-MM-DD" เสมอ (กันโดนแปลงเป็น ISO/UTC)
      const normalized = {
        ...json,
        birthDate: (json.birthDate || json.birth_date || "").slice(0, 10),
      };

      setData(normalized);
      setServerRole(normalized.role || role);
    })().catch(console.error);
  }, [API, userId, role]);

  // โหลดสาขาเฉพาะหมอ
  useEffect(() => {
    if (serverRole !== "doctor") return;
    (async () => {
      const r = await fetch(`${API}/api/specialties`);
      if (!r.ok) throw new Error("load specialties failed");
      const sp = await r.json();
      setSpecialties(Array.isArray(sp) ? sp : []);
    })().catch(console.error);
  }, [API, serverRole]);

  const onChange = (key, nested = false) => (e) => {
    const v = e.target.value;
    setData((d) => {
      if (!d) return d;
      if (!nested) return { ...d, [key]: v };
      return { ...d, address: { ...d.address, [key]: v } };
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!data || !userId) return;

    let payload;
    if (serverRole === "patient") {
      if (data.address?.postalCode && !/^\d{5}$/.test(data.address.postalCode)) {
        alert("รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก");
        return;
      }
      payload = {
        role: "patient",
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        // ❌ ไม่ส่ง birthDate (ล็อกไม่ให้แก้)
        address: {
          line1: data.address?.line1 || "",
          district: data.address?.district || "",
          province: data.address?.province || "",
          postalCode: data.address?.postalCode || "",
        },
      };
    } else {
      // แพทย์
      if (!data.specialtyId) {
        alert("กรุณาเลือกสาขาความเชี่ยวชาญ");
        return;
      }
      payload = {
        role: "doctor",
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        specialtyId: Number(data.specialtyId),
      };
    }

    try {
      setSaving(true);
      const res = await fetch(`${API}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("บันทึกล้มเหลว");
      setToast("บันทึกโปรไฟล์เรียบร้อย");
      setTimeout(() => setToast(""), 1800);
    } catch (err) {
      console.error(err);
      alert(err.message || "บันทึกล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  // ---------- ส่งคำขอ: เปลี่ยนรหัสผ่าน ----------
  async function changePassword(e) {
    e.preventDefault();
    if (!userId) return;

    if (!pw.current || !pw.next || !pw.confirm) {
      return alert("กรอกข้อมูลให้ครบ");
    }
    if (pw.next.length < 8) {
      return alert("รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร");
    }
    if (pw.next !== pw.confirm) {
      return alert("รหัสผ่านใหม่และยืนยันไม่ตรงกัน");
    }
    if (pw.current === pw.next) {
      return alert("รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน");
    }

    try {
      setSavingPw(true);
      const r = await fetch(`${API}/api/users/${userId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pw.current,
          newPassword: pw.next,
        }),
      });
      const js = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(js?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");

      setToast("เปลี่ยนรหัสผ่านเรียบร้อย");
      setPw({ current: "", next: "", confirm: "" });
      setTimeout(() => setToast(""), 1800);
    } catch (err) {
      console.error(err);
      alert(err.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setSavingPw(false);
    }
  }

  if (!data || !serverRole) {
    return <div className="profile" style={{ padding: 32 }}>กำลังโหลดโปรไฟล์…</div>;
  }

  return (
    <div className="profile">
      <div className="profile__container">
        {/* ซ้าย */}
        <aside className="profile__left">
          <div className="profile__hero">
            <h2>โปรไฟล์ของฉัน</h2>
            <p>ปรับปรุงข้อมูลติดต่อและที่อยู่ได้จากหน้านี้</p>
            {serverRole === "doctor" && <p>สำหรับแพทย์ เลือก “สาขาความเชี่ยวชาญ” ที่ให้บริการ</p>}
          </div>
        </aside>

        {/* เนื้อหาหลัก */}
        <section className="profile__main">
          <div className="profile__tabs">
            <button className={`tab ${tab==="info" ? "is-active" : ""}`} onClick={() => setTab("info")}>ข้อมูลส่วนตัว</button>
            <button className={`tab ${tab==="security" ? "is-active" : ""}`} onClick={() => setTab("security")}>ความปลอดภัย</button>
          </div>

          {tab === "info" ? (
            <form className="card" onSubmit={save}>
              <div className="profile__header">
                <div className="avatar">
                  <img
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(`${data.firstName||""} ${data.lastName||""}`)}`}
                    alt="avatar"
                  />
                  <div className="avatar__actions">
                    <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()} disabled>
                      เปลี่ยนรูป
                    </button>
                    <input ref={fileRef} type="file" hidden />
                  </div>
                </div>

                <div className="who">
                  <div className="role">
                    บทบาท: <span className="role__badge">{serverRole === "doctor" ? "แพทย์" : "คนไข้"}</span>
                  </div>
                  <h3>{data.firstName} {data.lastName}</h3>
                  <div className="muted">{data.email}</div>
                </div>
              </div>

              <div className="grid grid--2">
                <div className="form-group">
                  <label>ชื่อ</label>
                  <input value={data.firstName || ""} onChange={onChange("firstName")} required />
                </div>
                <div className="form-group">
                  <label>นามสกุล</label>
                  <input value={data.lastName || ""} onChange={onChange("lastName")} required />
                </div>

                <div className="form-group">
                  <label>อีเมล</label>
                  <input value={data.email || ""} readOnly />
                </div>
                <div className="form-group">
                  <label>เบอร์โทร</label>
                  <input value={data.phone || ""} onChange={onChange("phone")} />
                </div>

                {serverRole === "patient" && (
                  <>
                    <div className="form-group">
                      <label>วันเกิด</label>
                      {/* 🔒 แสดงตรงจาก DB (string) และล็อกไม่ให้แก้ */}
                      <input
                        type="text"
                        value={(data.birthDate || "").slice(0, 10)}
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label>เพศ</label>
                      <select value={data.gender || ""} disabled>
                        <option value="">— เลือกเพศ —</option>
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>ที่อยู่</label>
                      <input value={data.address?.line1 || ""} onChange={onChange("line1", true)} />
                    </div>
                    <div className="form-group">
                      <label>เขต/อำเภอ</label>
                      <input value={data.address?.district || ""} onChange={onChange("district", true)} />
                    </div>
                    <div className="form-group">
                      <label>จังหวัด</label>
                      <input value={data.address?.province || ""} onChange={onChange("province", true)} />
                    </div>
                    <div className="form-group">
                      <label>รหัสไปรษณีย์</label>
                      <input inputMode="numeric" pattern="\d{5}" value={data.address?.postalCode || ""} onChange={onChange("postalCode", true)} />
                    </div>
                  </>
                )}

                {serverRole === "doctor" && (
                  <div className="form-group full">
                    <label>สาขาความเชี่ยวชาญ</label>
                    <select value={data.specialtyId || ""} onChange={onChange("specialtyId")} required>
                      <option value="">— เลือกสาขา —</option>
                      {specialties.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name_th || sp.code}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="actions">
                <button className="btn btn--primary" disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
                </button>
              </div>
            </form>
          ) : (
            <form className="card" onSubmit={changePassword}>
              <h3 className="card__title">เปลี่ยนรหัสผ่าน</h3>
              <div className="grid grid--2">
                <div className="form-group full">
                  <label>รหัสผ่านปัจจุบัน</label>
                  <input
                    type="password"
                    value={pw.current}
                    onChange={onPwChange("current")}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>รหัสผ่านใหม่</label>
                  <input
                    type="password"
                    value={pw.next}
                    onChange={onPwChange("next")}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>ยืนยันรหัสผ่านใหม่</label>
                  <input
                    type="password"
                    value={pw.confirm}
                    onChange={onPwChange("confirm")}
                    placeholder="พิมพ์ซ้ำอีกครั้ง"
                    required
                  />
                </div>
              </div>
              <div className="actions">
                <button className="btn btn--primary" disabled={savingPw}>
                  {savingPw ? "กำลังบันทึก..." : "อัปเดตรหัสผ่าน"}
                </button>
              </div>
              <p className="muted" style={{marginTop: 8}}>
                เคล็ดลับ: ใช้อักษรผสมตัวพิมพ์เล็ก/ใหญ่ ตัวเลข และอักขระพิเศษ เพื่อความปลอดภัยมากขึ้น
              </p>
            </form>
          )}
        </section>

        {/* ขวา */}
        <aside className="profile__right">
          <div className="profile__tip">
            <h4>ลัดไปยัง</h4>
            <ul>
              {serverRole === "patient" && (
                <>
                  <li><a href="/search">ค้นหาแพทย์</a></li>
                  <li><a href="/my-appointments">นัดของฉัน</a></li>
                </>
              )}
              {serverRole === "doctor" && <li><a href="/doctor">จัดตารางของฉัน</a></li>}
            </ul>
          </div>
        </aside>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
