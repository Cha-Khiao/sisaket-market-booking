import { withAuth } from "next-auth/middleware";

export default withAuth({
  // หน้าเพจที่จะให้เด้งไปถ้ายังไม่ได้ล็อกอิน
  pages: {
    signIn: "/login",
  },
});

// กำหนด Path ที่ต้องการล็อก (Protect Routes)
export const config = {
  matcher: [
    "/booking/:path*", // ล็อกหน้าจองทั้งหมด
    "/admin/:path*",   // ล็อกหน้าแอดมินทั้งหมด (ที่เรากำลังจะสร้าง)
  ],
};