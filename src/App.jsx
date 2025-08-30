// src/App.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import DoctorSearch from "./pages/DoctorSearch";
import Appointment from "./pages/Appointment";
import MyAppointments from "./pages/MyAppointments";
import Profile from "./pages/Profile";
import DoctorDashboard from "./pages/DoctorDashboard";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import { isLoggedIn, getRole } from "./services/auth";

function RequireAuth({ children }) {
  const loc = useLocation();
  if (!isLoggedIn()) {
    alert("กรุณาเข้าสู่ระบบหรือสมัครสมาชิกเพื่อใช้งาน");
    return <Navigate to="/" replace state={{ from: loc }} />;
  }
  return children;
}

function RequireRole({ role, children }) {
  const loc = useLocation();
  if (!isLoggedIn()) {
    alert("กรุณาเข้าสู่ระบบ");
    return <Navigate to="/" replace state={{ from: loc }} />;
  }
  if (getRole() !== role) {
    alert("สิทธิ์ไม่ตรงกับหน้าที่ต้องการเข้าถึง");
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        {/* public */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* patient only */}
        <Route
          path="/search"
          element={
            <RequireRole role="patient">
              <DoctorSearch />
            </RequireRole>
          }
        />
        <Route
          path="/appointment/:doctorId"
          element={
            <RequireRole role="patient">
              <Appointment />
            </RequireRole>
          }
        />
        <Route
          path="/my-appointments"
          element={
            <RequireRole role="patient">
              <MyAppointments />
            </RequireRole>
          }
        />

        {/* doctor only */}
        <Route
          path="/doctor"
          element={
            <RequireRole role="doctor">
              <DoctorDashboard />
            </RequireRole>
          }
        />

        {/* both roles */}
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
