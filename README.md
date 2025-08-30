🌿 ClinicCare Frontend
ผู้ป่วย:
สมัครสมาชิก / เข้าสู่ระบบ
ค้นหาแพทย์ตามสาขา
จองนัด เลื่อนนัด ยกเลิกนัด
ดูรายการนัดของตนเอง
แก้ไขข้อมูลโปรไฟล์
แพทย์:
สมัครสมาชิก / เข้าสู่ระบบ
จัดการเวลาว่างของตัวเอง
ดูนัดหมายของผู้ป่วยในแต่ละวัน
แก้ไขข้อมูลโปรไฟล์

📦 การติดตั้ง
1. Clone โปรเจกต์
  git clone https://github.com/Tawatchai-03/clinic-frontend.git

    cd cliniccare-frontend

3. ติดตั้ง Dependencies
  npm install

4. สร้างไฟล์ Environment
  สร้างไฟล์ .env ที่ root ของ frontend แล้วใส่ค่าตัวแปร API endpoint ของ backend:

    VITE_API_URL=http://localhost:3000


🚀 การรันโปรเจกต์ Development

    npm run dev

จากนั้นเปิดเบราว์เซอร์ไปที่:
👉 http://localhost:5173

🛠️ เทคโนโลยีที่ใช้
React 18 + Vite React Router

CSS Modules
(จัดการสไตล์แต่ละหน้า)

Fetch API สำหรับเชื่อมต่อกับ Backend

LocalStorage สำหรับเก็บ token / ข้อมูลผู้ใช้
