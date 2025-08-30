import { Link } from "react-router-dom";

export default function NotFound(){
  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg, #e8f5e9, #c8e6c9)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:"24px"
    }}>
      <div style={{
        background:"#fff", border:"1px solid #e0f2e9", borderRadius:20,
        boxShadow:"0 10px 32px rgba(0,0,0,.12)", padding:"28px 36px", textAlign:"center"
      }}>
        <h1 style={{color:"#2e7d32", margin:"0 0 8px"}}>404</h1>
        <p style={{margin:"0 0 16px"}}>ไม่พบหน้าที่คุณต้องการ</p>
        <Link to="/search" style={{
          display:"inline-block", padding:"12px 16px", borderRadius:10,
          background:"linear-gradient(135deg,#4caf50,#66bb6a)", color:"#fff", textDecoration:"none"
        }}>
          กลับไปค้นหาแพทย์
        </Link>
      </div>
    </div>
  );
}
