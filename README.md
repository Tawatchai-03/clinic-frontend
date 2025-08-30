# 🌿 ClinicCare Frontend

Frontend ของระบบ **ClinicCare** สำหรับการจัดการนัดหมายคลินิก  
สร้างด้วย **React 18 + Vite** และเชื่อมต่อกับ Backend ผ่าน REST API  

---

## 👩‍⚕️ ฟีเจอร์การทำงาน

### ผู้ป่วย
- สมัครสมาชิก / เข้าสู่ระบบ  
- ค้นหาแพทย์ตามสาขา  
- จองนัด เลื่อนนัด ยกเลิกนัด  
- ดูรายการนัดของตนเอง  
- แก้ไขข้อมูลโปรไฟล์  

### แพทย์
- สมัครสมาชิก / เข้าสู่ระบบ  
- จัดการเวลาว่างของตัวเอง  
- ดูนัดหมายของผู้ป่วยในแต่ละวัน  
- แก้ไขข้อมูลโปรไฟล์  

---

## 📦 การติดตั้ง (Installation)

```bash
# 1. Clone โปรเจกต์
git clone https://github.com/Tawatchai-03/clinic-frontend.git
cd clinic-frontend
# 2. ติดตั้ง Dependencies
npm install
⚙️ การตั้งค่า Environment
สร้างไฟล์ .env ที่ root ของ frontend แล้วใส่ค่าตัวแปร API endpoint ของ backend:

env
Copy code
VITE_API_URL=http://localhost:3000


🚀 การรันโปรเจกต์ (Development)
Copy code
npm run dev
จากนั้นเปิดเบราว์เซอร์ไปที่:
👉 http://localhost:5173

🛠️ Tech Stack
⚛️ React 18 + Vite

🛣️ React Router v6

🎨 CSS Modules (จัดการสไตล์แยกแต่ละหน้า)

🌐 Fetch API สำหรับเชื่อมต่อกับ Backend

💾 LocalStorage สำหรับเก็บ token / ข้อมูลผู้ใช้
