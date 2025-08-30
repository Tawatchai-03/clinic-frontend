import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="home">
      {/* แถบซ้ายโทนเขียว (hero) */}
      <section className="home__left">
        <div className="floating-elements">
          <i className="floating-element fas fa-heartbeat"></i>
          <i className="floating-element fas fa-stethoscope"></i>
          <i className="floating-element fas fa-user-md"></i>
          <i className="floating-element fas fa-pills"></i>
        </div>
        
        <div className="home__hero">
          <i className="home__hero-icon fas fa-leaf" aria-hidden="true"></i>
          <h2>ดูแลสุขภาพอย่างเป็นธรรมชาติ</h2>
          <p>จองนัดพบแพทย์ ตรวจสอบตาราง และจัดการข้อมูลของคุณได้ในที่เดียว</p>
          
          <div className="home__features">
            <div className="feature-item">
              <i className="fas fa-calendar-check"></i>
              <span>จองนัดหมายออนไลน์ 24/7</span>
            </div>
            <div className="feature-item">
              <i className="fas fa-user-shield"></i>
              <span>ข้อมุลปลอดภัยและเป็นส่วนตัว</span>
            </div>
            <div className="feature-item">
              <i className="fas fa-heart"></i>
              <span>ดูแลสุขภาพอย่างครอบคลุม</span>
            </div>
          </div>
        </div>
      </section>

      {/* พื้นที่ขวา: การ์ดสมัคร/เข้าสู่ระบบ */}
      <section className="home__right">
        <div className="medical-icons">
          <i className="fas fa-hospital"></i>
          <i className="fas fa-ambulance"></i>
          <i className="fas fa-first-aid"></i>
        </div>
        
        <div className="home__card">
          <div className="home__brand">
            <span className="home__logo" aria-hidden="true">🌿</span>
            <h1>ClinicCare</h1>
          </div>

          <p className="home__subtitle">
            ยินดีต้อนรับเข้าสู่ระบบโรงพยาบาล เลือกการสมัครสมาชิกหรือเข้าสู่ระบบเพื่อใช้งาน
          </p>

          <div className="home__actions">
            <Link to="/register?role=patient" className="btn btn--primary">
              <i className="fas fa-user-plus"></i>
              สมัครเป็นคนไข้
            </Link>
            <Link to="/register?role=doctor" className="btn btn--primary-alt">
              <i className="fas fa-user-md"></i>
              สมัครเป็นหมอ
            </Link>
            <Link to="/login" className="btn btn--ghost">
              <i className="fas fa-sign-in-alt"></i>
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}