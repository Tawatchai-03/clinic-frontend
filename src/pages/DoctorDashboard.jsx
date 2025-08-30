// src/pages/DoctorDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import "./DoctorDashboard.css";

// สร้าง slot 09:00–16:30 (ครึ่งชั่วโมง)
function buildSlots() {
  const result = [];
  for (let h = 9; h <= 16; h++) {
    result.push(`${String(h).padStart(2, "0")}:00`);
    if (h !== 16) result.push(`${String(h).padStart(2, "0")}:30`);
  }
  return result;
}
const BASE_SLOTS = buildSlots();

function nextDays(n = 7) {
  const days = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d);
  }
  return days;
}

// format YYYY-MM-DD
const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

export default function DoctorDashboard() {
  // auth จาก localStorage (ตั้งไว้ตอน login)
  const auth = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const doctorId = auth?.id;
  const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "";

  // state เดิม (คง className และโครง)
  const [days] = useState(nextDays(7));
  const [selectedDate, setSelectedDate] = useState(nextDays(1)[0]);
  const [availability, setAvailability] = useState({}); // { [dayKey]: Set<string> }
  const [todayList, setTodayList] = useState([]); // รายการนัดทั้งหมด (ไม่กรองวัน)
  const [doctor, setDoctor] = useState({
    name: "",
    specialtyName: "",
    email: "",
    avatar: "",
  });
  const [specialtiesMap, setSpecialtiesMap] = useState({}); // {id: name_th}

  const dayKey = selectedDate.toDateString();
  const daySlots = availability[dayKey] || new Set();

  // ------- โหลดข้อมูลแพทย์ + specialties (เพื่อแสดงชื่อสาขา) -------
  useEffect(() => {
    if (!doctorId || !API) return;

    (async () => {
      try {
        // โปรไฟล์หมอ
        const prof = await fetch(`${API}/api/users/${doctorId}`);
        const profJson = await prof.json().catch(() => null);

        // สาขา
        const sp = await fetch(`${API}/api/specialties`);
        const spJson = await sp.json().catch(() => []);
        const spMap = {};
        (spJson || []).forEach((s) => {
          spMap[s.id] = s.name_th || s.label_th || s.code || "";
        });
        setSpecialtiesMap(spMap);

        // ตั้งค่า doctor display (ใช้ Dicebear Initials ให้ตรงกับหน้า Profile)
        const fullName = [profJson?.firstName, profJson?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();

        const specName =
          spMap[profJson?.specialtyId] ||
          profJson?.specialty?.name_th ||
          profJson?.specialtyLabel ||
          "-";

        const dicebear = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          fullName || "แพทย์"
        )}`;

        setDoctor({
          name: fullName || "แพทย์",
          specialtyName: specName,
          email: profJson?.email || "",
          avatar: dicebear,
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [API, doctorId]);

  // ------- โหลด "รายการนัดทั้งหมดของหมอ" (ไม่กรองวัน) -------
  useEffect(() => {
    if (!doctorId || !API) return;

    (async () => {
      try {
        // ไม่ส่ง date -> backend คืนทุกรายการ (ยกเว้น cancelled) เรียงวันที่/เวลาให้แล้ว
        const res = await fetch(`${API}/api/appointments/doctor?doctorId=${doctorId}`);
        const list = (await res.json().catch(() => [])) || [];

        const mapped = list.map((a) => {
          const rawDate = a.apt_date || a.date; // YYYY-MM-DD
          const dateLabel = rawDate
            ? new Date(rawDate).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "-";

          return {
            id: a.id,
            date: dateLabel,
            time: (a.apt_time || a.time || "").slice(0, 5),
            patient:
              [a.patient_first_name, a.patient_last_name]
                .filter(Boolean)
                .join(" ")
                .trim() || "คนไข้",
            note: a.note || "",
            status: a.status || "booked",
          };
        });

        setTodayList(mapped);
      } catch (e) {
        console.error("load doctor appointments error:", e);
        setTodayList([]);
      }
    })();
  }, [API, doctorId]);

  // ------- โหลดเวลาว่างของหมอสำหรับวันที่เลือก -------
  useEffect(() => {
    if (!doctorId || !API || !selectedDate) return;

    (async () => {
      try {
        const q = `doctorId=${doctorId}&date=${toYMD(selectedDate)}`;
        // ตัวอย่าง endpoint: GET /api/doctor/availability?doctorId=&date=YYYY-MM-DD
        const res = await fetch(`${API}/api/doctor/availability?${q}`);
        const slots = (await res.json().catch(() => [])) || [];

        // แปลงเป็น Set ของ "HH:MM"
        const set = new Set(
          slots.map((s) => s.slot_time?.slice(0, 5) || s.time).filter(Boolean)
        );

        setAvailability((prev) => ({
          ...prev,
          [dayKey]: set,
        }));
      } catch (e) {
        console.error(e);
        // ถ้าโหลดไม่ได้ ก็อย่าทำให้หน้าพัง
        setAvailability((prev) => ({
          ...prev,
          [dayKey]: new Set(),
        }));
      }
    })();
  }, [API, doctorId, selectedDate, dayKey]);

  // ------- แสดงผล (เหมือนเดิมทั้งหมด) -------
  const fullDate = (d) =>
    d.toLocaleDateString("th-TH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const chipDate = (d) => ({
    dow: d.toLocaleDateString("th-TH", { weekday: "short" }),
    dd: d.getDate(),
    mon: d.toLocaleDateString("th-TH", { month: "short" }),
  });

  const toggleSlot = (t) => {
    setAvailability((prev) => {
      const copy = { ...prev };
      const set = new Set(copy[dayKey] || []);
      if (set.has(t)) set.delete(t);
      else set.add(t);
      copy[dayKey] = set;
      return copy;
    });
  };

  const clearDay = () => {
    setAvailability((prev) => ({ ...prev, [dayKey]: new Set() }));
  };

  // ------- บันทึกเวลาว่าง (คงปุ่มเดิม) -------
  const saveDay = async () => {
    if (!doctorId || !API) return;
    try {
      const payload = {
        doctorId,
        date: toYMD(selectedDate),
        slots: [...(availability[dayKey] || new Set())], // ["09:00","10:00",...]
      };
      // ตัวอย่าง endpoint: PUT /api/doctor/availability
      await fetch(`${API}/api/doctor/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // คง flow เดิม
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dd">
      <div className="dd__container">
        {/* ซ้าย: โปรไฟล์หมอ + รายการนัดทั้งหมด */}
        <aside className="dd__left">
          <div className="dd__card dd__profile">
            <img className="dd__avatar" src={doctor.avatar} alt={doctor.name} />
            <div className="dd__who">
              <h3>{doctor.name || "แพทย์"}</h3>
              <div className="dd__spec">{doctor.specialtyName || "-"}</div>
            </div>
          </div>

          <div className="dd__card dd__today">
            <h4>รายการนัดทั้งหมด</h4>
            {todayList.length === 0 ? (
              <div className="dd__empty">ยังไม่มีรายการนัด</div>
            ) : (
              <ul className="dd__list">
                {todayList.map((a) => (
                  <li key={a.id} className="dd__item">
                    <div className="dd__time">{a.time}</div>
                    <div className="dd__info">
                      <div className="dd__patient">{a.patient}</div>
                      <div className="dd__date">{a.date}</div>
                      {a.note ? <div className="dd__note">{a.note}</div> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* กลาง: จัดการเวลาว่าง */}
        <section className="dd__main">
          <div className="dd__card">
            <div className="dd__head">
              <div>
                <h3>จัดการเวลาว่าง</h3>
                <div className="dd__muted">{fullDate(selectedDate)}</div>
              </div>
              <div className="dd__actions">
                <button className="btn btn--ghost" onClick={clearDay}>
                  ล้างเวลาว่างวันนี้
                </button>
                <button className="btn btn--primary" onClick={saveDay}>
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </div>

            {/* เลือกวัน */}
            <div className="dd__days">
              {days.map((d) => {
                const { dow, dd, mon } = chipDate(d);
                const active = d.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={d.toISOString()}
                    className={`dd__day ${active ? "is-active" : ""}`}
                    onClick={() => setSelectedDate(d)}
                  >
                    <div className="dow">{dow}</div>
                    <div className="d">{dd}</div>
                    <div className="m">{mon}</div>
                  </button>
                );
              })}
            </div>

            {/* ช่องเวลาครึ่งชั่วโมง */}
            <div className="dd__slots">
              {BASE_SLOTS.map((t) => {
                const active = daySlots.has(t);
                return (
                  <button
                    key={t}
                    className={`slot ${active ? "is-active" : ""}`}
                    onClick={() => toggleSlot(t)}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ขวา: สรุปของวัน */}
        <aside className="dd__right">
          <div className="dd__card">
            <h4>สรุปเวลาว่าง</h4>
            <div className="dd__muted">{fullDate(selectedDate)}</div>
            <div className="dd__summary">
              {[...daySlots].length === 0 ? (
                <div className="dd__empty">ยังไม่ได้ตั้งเวลาว่าง</div>
              ) : (
                <div className="dd__chips">
                  {[...daySlots].sort().map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
