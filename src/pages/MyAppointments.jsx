import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./MyAppointments.css";

export default function MyAppointments() {
  // อ่าน user ปัจจุบัน
  const auth = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("auth_user") || "{}"); }
    catch { return {}; }
  }, []);
  const patientId = auth?.id;

  const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

  // แท็บ: upcoming | cancelled
  const [tab, setTab] = useState("upcoming");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // helper: avatar จากชื่อ (fallback ถ้า backend ไม่ส่งรูปมา)
  const avatarOf = (name) =>
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || "")}`;

  // helper: แสดงวันที่เป็นตัวเลข YYYY-MM-DD เท่านั้น
  const displayDate = (raw) => {
    const s = String(raw || "");
    // รองรับทั้ง 'YYYY-MM-DD' และ ISO 'YYYY-MM-DDTHH:mm:ss.sssZ'
    return s.includes("T") ? s.split("T")[0] : s.slice(0, 10);
  };

  // helper: HH:MM
  const displayTimeHM = (t) => String(t || "").slice(0, 5);

  // โหลดรายการนัด
  useEffect(() => {
    if (!patientId) {
      setErr("กรุณาเข้าสู่ระบบ");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/appointments?patientId=${patientId}`);
        if (!res.ok) throw new Error("โหลดรายการนัดไม่สำเร็จ");
        const data = await res.json();
        // คาดหวัง: { id, status, date, time, doctorId, doctorName, specialty, [avatar] }
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [API, patientId]);

  // ยกเลิกนัด (เปิด slot คืนที่ backend)
  const onCancel = async (id) => {
    const ok = window.confirm("ยืนยันการยกเลิกนัดนี้หรือไม่?");
    if (!ok) return;
    try {
      const res = await fetch(`${API}/api/appointments/${id}/cancel`, { method: "PUT" });
      const js = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(js?.message || "ยกเลิกไม่สำเร็จ");

      // อัปเดตสถานะในหน้า
      setItems(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));

      alert("ยกเลิกนัดเรียบร้อยแล้ว เวลาดังกล่าวได้ถูกเปิดให้จองใหม่");
      setTab("cancelled");
    } catch (e) {
      alert(e.message || "ยกเลิกไม่สำเร็จ");
    }
  };

  // กด “จองใหม่” จากแท็บยกเลิกแล้ว: เอาออกจากลิสต์ยกเลิกทันที (ฝั่ง UI)
  const onRebookClick = (id, canLink) => (ev) => {
    if (!canLink) { ev.preventDefault(); return; }
    // ซ่อนรายการที่ยกเลิกนั้นออกไปเลย
    setItems(prev => prev.filter(x => x.id !== id));
    // ไปหน้าจองของหมอคนนั้นต่อ (ปล่อยให้ <Link> ทำงาน)
  };

  // สถานะสำหรับกรอง
  const statusForTab = (a) => (a.status === "cancelled" ? "cancelled" : "upcoming");

  // กรองรายการตามแท็บ
  const list = useMemo(() => {
    return items.filter(a => {
      const s = statusForTab(a);
      return tab === "upcoming" ? s === "upcoming" : s === "cancelled";
    });
  }, [items, tab]);

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="ma">
        <div className="ma__container"><div className="ma__empty">กำลังโหลด…</div></div>
      </div>
    );
  }
  if (err) {
    return (
      <div className="ma">
        <div className="ma__container"><div className="ma__empty">{err}</div></div>
      </div>
    );
  }

  const countUpcoming = items.filter(a => statusForTab(a) === "upcoming").length;
  const countCancelled = items.filter(a => statusForTab(a) === "cancelled").length;

  return (
    <div className="ma">
      <div className="ma__container">
        {/* ซ้าย */}
        <aside className="ma__left">
          <div className="ma__hero">
            <h2>นัดของฉัน</h2>
            <p>ตรวจสอบสถานะนัดหมาย และจัดการการนัดของคุณ</p>
          </div>
        </aside>

        {/* กลาง */}
        <section className="ma__main">
          {/* แท็บ */}
          <div className="ma__tabs">
            <button
              className={`tab ${tab === "upcoming" ? "is-active" : ""}`}
              onClick={() => setTab("upcoming")}
            >
              นัดที่จะถึง {countUpcoming ? `(${countUpcoming})` : ""}
            </button>
            <button
              className={`tab ${tab === "cancelled" ? "is-active" : ""}`}
              onClick={() => setTab("cancelled")}
            >
              ยกเลิกแล้ว {countCancelled ? `(${countCancelled})` : ""}
            </button>
          </div>

          {/* รายการ */}
          {list.length === 0 ? (
            <div className="ma__empty">
              {tab === "upcoming" && "ยังไม่มีนัดที่จะถึง"}
              {tab === "cancelled" && "ยังไม่มีนัดที่ถูกยกเลิก"}
            </div>
          ) : (
            <div className="ma__list">
              {list.map((a) => {
                const s = statusForTab(a); // upcoming | cancelled
                const canLink = Boolean(a.doctorId);
                const avatarSrc = a.avatar || avatarOf(a.doctorName);

                return (
                  <article className="appt" key={a.id}>
                    {/* รูปซ้าย */}
                    <img className="appt__avatar" src={avatarSrc} alt={a.doctorName} loading="lazy" />

                    {/* เนื้อหาขวา */}
                    <div className="appt__body">
                      <div className="appt__title">
                        <h3>{a.doctorName}</h3>
                        <span className={`badge badge--${s}`}>
                          {s === "upcoming" ? "กำลังมาถึง" : "ยกเลิกแล้ว"}
                        </span>
                      </div>

                      <div className="appt__meta">
                        <span className="appt__spec">{a.specialty || "-"}</span>
                        <span>•</span>
                        {/* แสดงวันที่แบบตัวเลขล้วน + เวลา HH:MM */}
                        <span>{displayDate(a.date)} เวลา {displayTimeHM(a.time)} น.</span>
                      </div>

                      <div className="appt__actions">
                        {s === "upcoming" ? (
                          <>
                            <Link
                              to={canLink ? `/appointment/${a.doctorId}` : "#"}
                              className={`btn btn--ghost ${canLink ? "" : "is-disabled"}`}
                              onClick={(ev) => { if (!canLink) ev.preventDefault(); }}
                              title={canLink ? "" : "ไม่มีรหัสแพทย์สำหรับเลื่อนนัด"}
                            >
                              เลื่อนนัด
                            </Link>
                            <button className="btn btn--danger" onClick={() => onCancel(a.id)}>
                              ยกเลิกนัด
                            </button>
                          </>
                        ) : (
                          <Link
                            to={canLink ? `/appointment/${a.doctorId}` : "#"}
                            className={`btn btn--primary ${canLink ? "" : "is-disabled"}`}
                            onClick={onRebookClick(a.id, canLink)}
                            title={canLink ? "" : "ไม่มีรหัสแพทย์สำหรับจองใหม่"}
                          >
                            จองใหม่
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ขวา */}
        <aside className="ma__right">
          <div className="ma__tip">
            <h4>คำแนะนำ</h4>
            <ul>
              <li>คุณสามารถกด “เลื่อนนัด” เพื่อเลือกวัน/เวลาใหม่</li>
              <li>ยกเลิกนัดได้เฉพาะนัดที่จะมาถึง</li>
              <li>เมื่อยกเลิกนัด เวลาดังกล่าวจะเปิดให้จองได้อีกครั้ง</li>
              <li>กด “จองใหม่” เพื่อกลับไปหาหมอคนเดิมได้ทันที</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
