// src/pages/DoctorSearch.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./DoctorSearch.css";

export default function DoctorSearch() {
  const API = useMemo(
    () => (import.meta.env.VITE_API_URL || "").replace(/\/+$/, ""),
    []
  );

  const [q, setQ] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [sort, setSort] = useState("name_asc"); // name_asc | name_desc | next_soonest

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSp, setLoadingSp] = useState(false);
  const [err, setErr] = useState("");

  // ---------- helpers ----------
  const toHM = (d) =>
    d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

  // คืน "วันนี้ 15:30" / "พรุ่งนี้ 09:00" / "พฤ. 10:30" / "30 ส.ค. 11:00"
  const formatNextAvailable = (val) => {
    if (!val) return null;
    const s = String(val).replace(" ", "T");
    const dt = new Date(s);
    if (Number.isNaN(dt.getTime())) return null;

    const now = new Date();
    const todayYMD = now.toISOString().slice(0, 10);
    const dtYMD = dt.toISOString().slice(0, 10);

    const oneDay = 24 * 60 * 60 * 1000;
    const startToday = new Date(todayYMD + "T00:00:00");
    const startDt = new Date(dtYMD + "T00:00:00");
    const diffDays = Math.round((startDt - startToday) / oneDay);

    if (diffDays === 0) return `วันนี้ ${toHM(dt)}`;
    if (diffDays === 1) return `พรุ่งนี้ ${toHM(dt)}`;

    if (diffDays > 1 && diffDays <= 7) {
      const wd = dt.toLocaleDateString("th-TH", { weekday: "short" });
      return `${wd} ${toHM(dt)}`;
    }
    const dateStr = dt.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
    });
    return `${dateStr} ${toHM(dt)}`;
  };

  const sortDoctors = (list) => {
    const cp = [...list];
    if (sort === "name_asc") {
      cp.sort((a, b) => (a.name || "").localeCompare(b.name || "", "th"));
    } else if (sort === "name_desc") {
      cp.sort((a, b) => (b.name || "").localeCompare(a.name || "", "th"));
    } else if (sort === "next_soonest") {
      cp.sort((a, b) => {
        const ta = a.next_available ? new Date(String(a.next_available).replace(" ", "T")).getTime() : Infinity;
        const tb = b.next_available ? new Date(String(b.next_available).replace(" ", "T")).getTime() : Infinity;
        if (ta === tb) return (a.name || "").localeCompare(b.name || "", "th");
        return ta - tb;
      });
    }
    return cp;
  };

  // ---------- โหลดสาขา ----------
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setLoadingSp(true);
        const r = await fetch(`${API}/api/specialties`);
        if (!r.ok) throw new Error("โหลดสาขาไม่สำเร็จ");
        const data = await r.json();
        if (!stop) setSpecialties(data || []);
      } catch (e) {
        if (!stop) setErr(e.message || "โหลดสาขาไม่สำเร็จ");
      } finally {
        if (!stop) setLoadingSp(false);
      }
    })();
    return () => { stop = true; };
  }, [API]);

  // ---------- โหลดรายชื่อหมอ (ตามตัวกรอง) ----------
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (specialtyId) params.set("specialtyId", String(specialtyId));

        const r = await fetch(`${API}/api/doctors?${params.toString()}`);
        if (!r.ok) throw new Error("โหลดรายชื่อแพทย์ไม่สำเร็จ");
        const data = await r.json();
        if (!stop) setDoctors(sortDoctors(data || []));
      } catch (e) {
        if (!stop) setErr(e.message || "โหลดรายชื่อแพทย์ไม่สำเร็จ");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API, q, specialtyId, sort]);

  return (
    <div className="ds">
      <div className="ds__container">
        {/* ซ้าย: คำโปรย */}
        <aside className="ds__left">
          <div className="ds__hero">
            <h2>ค้นหาแพทย์</h2>
            <p>ค้นหาตามสาขาความเชี่ยวชาญ เช่น “ผิวหนัง”, “กุมารเวช”</p>
          </div>
        </aside>

        {/* กลาง: เนื้อหาหลัก */}
        <section className="ds__main">
          {/* แถบตัวกรอง */}
          <div className="ds__filters">
            <input
              className="ds__input"
              type="text"
              placeholder="พิมพ์สาขาแพทย์ เช่น ผิวหนัง, กุมารเวช…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <select
              className="ds__select"
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              disabled={loadingSp}
              title="กรองตามสาขา"
            >
              <option value="">
                {loadingSp ? "กำลังโหลดสาขา…" : "ทุกสาขา"}
              </option>
              {specialties.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name_th || sp.code}
                </option>
              ))}
            </select>

            <select
              className="ds__select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              title="เรียงลำดับ"
            >
              <option value="name_asc">เรียงตามชื่อ (ก-ฮ)</option>
              <option value="name_desc">เรียงตามชื่อ (ฮ-ก)</option>
              <option value="next_soonest">คิวว่างเร็วสุด</option>
            </select>
          </div>

          {/* ข้อความแจ้ง/จำนวนผล */}
          {err && (
            <div
              style={{
                margin: "8px 0 14px",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #ffcdd2",
                background: "#ffebee",
                color: "#b71c1c",
                fontSize: 14,
              }}
            >
              {err}
            </div>
          )}

          <div className="ds__meta">
            {loading ? (
              "กำลังโหลด…"
            ) : (
              <>
                พบแพทย์ทั้งหมด <b>{doctors.length}</b> รายการ
              </>
            )}
          </div>

          {/* รายการหมอ */}
          <div className="ds__grid">
            {!loading &&
              doctors.map((d) => {
                const nextStr = formatNextAvailable(d.next_available);
                return (
                  <article className="doc" key={d.id}>
                    <div className="doc__top">
                      <img
                        className="doc__avatar"
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          d.name || "?"
                        )}`}
                        alt={d.name}
                      />
                      <div className="doc__info">
                        <h3 className="doc__name">{d.name}</h3>
                        <div className="doc__sub">{d.specialty_name}</div>
                      </div>
                    </div>

                    <div className="doc__bottom">
                      <div className="doc__next">
                        ว่างครั้งถัดไป:{" "}
                        <b>{nextStr || "ยังไม่มีเวลาว่าง"}</b>
                      </div>
                      <Link
                        to={`/appointment/${d.id}`}
                        className="btn btn--primary"
                      >
                        จองนัด
                      </Link>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>

        {/* ขวา: Tips */}
        <aside className="ds__right">
          <div className="ds__tip">
            <h4>ตัวอย่างสาขายอดนิยม</h4>
            <ul>
              <li>ผิวหนัง (Dermatology)</li>
              <li>กุมารเวชกรรม (Pediatrics)</li>
              <li>อายุรกรรมหัวใจ (Cardiology)</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
