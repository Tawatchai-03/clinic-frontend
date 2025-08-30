// src/services/auth.js
const KEY = 'auth_user'; // ให้ตรงกับ Profile.jsx

// ย้ายค่าจากคีย์เก่า 'auth' -> 'auth_user' (ถ้ามี) ครั้งเดียว
(function migrateOnce() {
  try {
    const oldRaw = localStorage.getItem('auth');
    const newRaw = localStorage.getItem(KEY);
    if (oldRaw && !newRaw) {
      localStorage.setItem(KEY, oldRaw);
      localStorage.removeItem('auth');
    }
  } catch {}
})();

/**
 * เซ็ตข้อมูลผู้ใช้หลังล็อกอิน
 * ควรส่งอ็อบเจ็กต์ที่ได้จาก /api/login ตรง ๆ
 * (/api/login ตอนนี้ส่ง: {id, role, firstName, lastName, email}) — ยังไม่มี token
 */
export function setAuth({ id, role, firstName, lastName, email, token }) {
  const data = {
    id: id ?? null,
    role: role ?? null,
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    email: email ?? '',
    token: token || '' // ยังไม่ใช้ก็เก็บว่างไว้
  };
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

export function getAuth() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}

export function isLoggedIn() {
  const a = getAuth();
  return !!(a && a.id);
}

export function getRole() {
  return getAuth()?.role || null;
}
