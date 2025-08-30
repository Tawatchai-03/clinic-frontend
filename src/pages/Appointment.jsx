import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./Appointment.css";

// สร้าง slot เวลา (09:00–16:30 ทุกครึ่งชั่วโมง)
function buildSlots() {
  const out = [];
  for (let h = 9; h <= 16; h++) {
    const hh = String(h).padStart(2, "0");
    out.push(`${hh}:00`);
    if (h !== 16) out.push(`${hh}:30`);
  }
  return out;
}
const BASE_SLOTS = buildSlots();

// วันที่ถัดไป n วัน (สำหรับแถบเลือกวัน)
function buildNextDays(n = 7) {
  const days = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d);
  }
  return days;
}

// ฟอร์แมตวันที่แบบ Local (แก้ปัญหาเหลื่อมวัน)
function fmtDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // YYYY-MM-DD
}

export default function Appointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

  // อ่านผู้ใช้ (เอา id/role ไปใช้ตอนจอง)
  const auth = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user") || "{}");
    } catch {
      return {};
    }
  }, []);

  // สถานะ UI
  const days = useMemo(() => buildNextDays(7), []);
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [doctor, setDoctor] = useState(null); // {id, name, specialtyCode, specialtyNameTh, avatar?}
  const [openSlots, setOpenSlots] = useState(new Set());
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [msg, setMsg] = useState("");

  // -------- โหลดข้อมูลแพทย์ --------
  useEffect(() => {
    let abort = false;

    async function loadDoctor() {
      try {
        setLoadingDoc(true);
        setMsg("");

        // พยายามเรียกแบบเจาะจงก่อน (อาจยังไม่มีในแบ็กเอนด์)
        let res = await fetch(`${API}/api/doctors/${doctorId}`);
        if (res.status === 404) {
          // ถ้าไม่มี endpoint แบบเจาะจง ใช้ลิสต์แล้วหาเอา
          res = await fetch(`${API}/api/doctors`);
          if (!res.ok) throw new Error(`Load doctors failed (${res.status})`);
          const list = await res.json();
          const d = (list || []).find((x) => String(x.id) === String(doctorId));
          if (!d) throw new Error("ไม่พบข้อมูลแพทย์");
          if (!abort) setDoctor(normalizeDoctor(d));
          return;
        }
        if (!res.ok) throw new Error(`Load doctor failed (${res.status})`);
        const d = await res.json();
        if (!abort) setDoctor(normalizeDoctor(d));
      } catch (e) {
        console.error(e);
        if (!abort) setMsg(e.message || "โหลดข้อมูลแพทย์ไม่สำเร็จ");
      } finally {
        if (!abort) setLoadingDoc(false);
      }
    }

    loadDoctor();
    return () => {
      abort = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API, doctorId]);

  // ปรับโครง doctor ให้ field ที่ใช้ใน UI คงที่
  function normalizeDoctor(d) {
    return {
      id: d.id,
      name:
        d.name ||
        d.fullName ||
        [d.first_name, d.last_name].filter(Boolean).join(" ") ||
        "แพทย์",
      specialtyCode: d.specialty_code || d.specialty || null,
      // ใช้ชื่อสาขาจากแบ็กเอนด์โดยตรง (server ส่ง s.name_th เป็น specialty_name)
      specialtyNameTh: d.specialty_name || d.specialty_name_th || d.specialty_th || null,
      avatar:
        d.avatar ||
        d.avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          d.first_name ? `${d.first_name} ${d.last_name || ""}` : d.name || "DR"
        )}`,
    };
  }

  // -------- โหลดเวลาว่างของวันที่เลือก --------
  useEffect(() => {
    if (!doctor) return;
    let abort = false;

    async function loadOpenSlots() {
      try {
        setLoadingSlots(true);
        setMsg("");

        const date = fmtDateLocal(selectedDate); // ใช้ local date
        const res = await fetch(
          `${API}/api/doctor/availability?doctorId=${doctor.id}&date=${date}`
        );
        if (!res.ok) throw new Error(`Load availability failed (${res.status})`);
        // คาดว่า [{slot_time:"09:00:00", is_open:1}, ...]
        const rows = await res.json();
        const set = new Set(
          (rows || [])
            .filter((r) => Number(r.is_open) === 1)
            .map((r) => (r.slot_time || "").slice(0, 5)) // HH:MM
        );
        if (!abort) {
          setOpenSlots(set);
          if (selectedSlot && !set.has(selectedSlot)) setSelectedSlot("");
        }
      } catch (e) {
        console.error(e);
        if (!abort) setMsg(e.message || "โหลดเวลาว่างไม่สำเร็จ");
      } finally {
        if (!abort) setLoadingSlots(false);
      }
    }

    loadOpenSlots();
    return () => {
      abort = true;
    };
  }, [API, doctor, selectedDate, selectedSlot]);

  // -------- helper แสดงผลวันที่ --------
  function formatFull(d) {
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  }

  // -------- ยืนยันการจอง --------
  const onConfirm = async (e) => {
    e.preventDefault();
    if (!auth?.id) {
      alert("กรุณาเข้าสู่ระบบก่อนจองนัด");
      return;
    }
    if (!doctor?.id || !selectedSlot) {
      alert("กรุณาเลือกวันและช่วงเวลา");
      return;
    }
    try {
      setMsg("");
      const res = await fetch(`${API}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: auth.id,
          doctorId: doctor.id,
          date: fmtDateLocal(selectedDate), // ใช้ local date
          time: `${selectedSlot}:00`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `จองไม่สำเร็จ (${res.status})`);
      }
      alert("จองนัดสำเร็จ!");
      navigate("/my-appointments");
    } catch (err) {
      alert(err.message || "จองไม่สำเร็จ");
    }
  };

  // ---------- Render ----------
  if (loadingDoc && !doctor) {
    return (
      <div className="apt" style={{ padding: 24 }}>
        กำลังโหลดข้อมูลแพทย์…
      </div>
    );
  }
  if (!doctor) {
    return (
      <div className="apt" style={{ padding: 24 }}>
        ไม่พบข้อมูลแพทย์
      </div>
    );
  }

  const specialtyLabel = doctor.specialtyNameTh || "-";

  return (
    <div className="apt">
      <div className="apt__container">
        {/* ซ้าย: คำโปรย */}
        <aside className="apt__left">
          <div className="apt__hero">
            <h2>จองนัดพบแพทย์</h2>
            <p>เลือกวันและช่วงเวลาที่สะดวก เพื่อยืนยันการนัดหมาย</p>
          </div>
        </aside>

        {/* กลาง: การ์ดจอง */}
        <section className="apt__main">
          <header className="docHeader">
            <img className="docHeader__avatar" src={doctor.avatar} alt={doctor.name} />
            <div className="docHeader__meta">
              <h3 className="docHeader__name">{doctor.name}</h3>
              <div className="docHeader__sub">{specialtyLabel}</div>
            </div>
            <Link to="/search" className="docHeader__back">
              ← เปลี่ยนแพทย์
            </Link>
          </header>

          {/* เลือกวัน */}
          <div className="apt__section">
            <h4 className="apt__label">เลือกวัน</h4>
            <div className="dayStrip">
              {days.map((d) => {
                const active = d.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={String(d.getTime())}
                    className={`dayStrip__item ${active ? "is-active" : ""}`}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedSlot("");
                    }}
                  >
                    <div className="dayStrip__dow">
                      {d.toLocaleDateString("th-TH", { weekday: "short" })}
                    </div>
                    <div className="dayStrip__date">{d.getDate()}</div>
                    <div className="dayStrip__mon">
                      {d.toLocaleDateString("th-TH", { month: "short" })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* เลือกเวลาว่าง */}
          <div className="apt__section">
            <h4 className="apt__label">
              เลือกช่วงเวลา <span className="apt__hint">({formatFull(selectedDate)})</span>
            </h4>

            <div className="slotGrid">
              {BASE_SLOTS.map((t) => {
                const isOpen = openSlots.has(t);
                const active = selectedSlot === t;
                return (
                  <button
                    key={t}
                    className={`slot ${active ? "is-active" : ""}`}
                    disabled={!isOpen || loadingSlots}
                    onClick={() => setSelectedSlot(t)}
                    title={!isOpen ? "เต็มแล้ว" : ""}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {loadingSlots && (
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>กำลังโหลดเวลาว่าง…</div>
            )}
            {msg && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#1b5e20",
                  background: "#f1f8e9",
                  border: "1px solid #c8e6c9",
                  borderRadius: 10,
                  padding: "8px 10px",
                }}
              >
                {msg}
              </div>
            )}
          </div>

          {/* ปุ่มยืนยัน */}
          <form onSubmit={onConfirm} className="apt__actions">
            <button type="submit" className="btn btn--primary" disabled={!selectedSlot}>
              ยืนยันการจอง
            </button>
            <Link to="/search" className="btn btn--ghost">
              ยกเลิก
            </Link>
          </form>
        </section>

        {/* ขวา: สรุป */}
        <aside className="apt__right">
          <div className="summary">
            <h4>สรุปการนัดหมาย</h4>
            <div className="summary__row">
              <span>แพทย์</span>
              <b>{doctor.name}</b>
            </div>
            <div className="summary__row">
              <span>สาขา</span>
              <b>{specialtyLabel}</b>
            </div>
            <div className="summary__row">
              <span>วันเวลา</span>
              <b>
                {formatFull(selectedDate)} {selectedSlot || "-"} น.
              </b>
            </div>
            <p className="summary__note">หลังจากยืนยัน ระบบจะบันทึกนัดและแจ้งเตือนให้คุณล่วงหน้า</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
