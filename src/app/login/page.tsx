"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        toast.error(result.error);
        setLoading(false); // ⚡ ปลดล็อกปุ่มทันทีถ้าพาสเวิร์ดผิด
      } else {
        toast.success("เข้าสู่ระบบสำเร็จ! กำลังพาไปหน้าหลัก...");
        
        // ดึง Session ล่าสุดเพื่อเช็กว่าเป็น Admin หรือ ลูกค้า
        const session = await getSession();
        
        // ⚡ ใช้ window.location.href เพื่อบังคับเปลี่ยนหน้าทันที ไม่มีค้าง!
        if ((session?.user as any)?.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/booking";
        }
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setLoading(false); // ⚡ ปลดล็อกปุ่มถ้าเน็ตหลุดหรือเซิร์ฟเวอร์พัง
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏪</div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">เข้าสู่ระบบ</h1>
          <p className="text-gray-500 dark:text-gray-400">เพื่อจองพื้นที่ตลาดนัด จ.ศรีสะเกษ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">อีเมล</label>
            <input type="email" required className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:border-blue-500 transition-colors"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัสผ่าน</label>
            <input type="password" required className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:border-blue-500 transition-colors"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 mt-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:bg-green-400 disabled:cursor-wait">
            {loading ? "กำลังตรวจสอบ..." : "ล็อกอินเข้าสู่ระบบ"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          ยังไม่มีบัญชีผู้ค้า? <Link href="/register" className="text-green-600 dark:text-green-400 font-bold hover:underline">สมัครสมาชิกที่นี่</Link>
        </p>
        
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ← กลับหน้าหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  );
}