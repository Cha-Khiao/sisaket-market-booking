"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", phoneNumber: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("รหัสผ่านไม่ตรงกัน");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        router.push("/login"); // สมัครเสร็จ เด้งไปหน้า Login
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">สร้างบัญชีผู้ค้า</h1>
          <p className="text-gray-500 dark:text-gray-400">ระบบจองล็อกตลาดนัด จ.ศรีสะเกษ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อ-นามสกุล (หรือชื่อร้าน)</label>
            <input type="text" required className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:border-blue-500 transition-colors"
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เบอร์โทรศัพท์</label>
            <input type="tel" required maxLength={10} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:border-blue-500 transition-colors"
              value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">อีเมล</label>
            <input type="email" required className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:border-blue-500 transition-colors"
              value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัสผ่าน</label>
            <input type="password" required minLength={6} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:border-blue-500 transition-colors"
              value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ยืนยันรหัสผ่าน</label>
            <input type="password" required minLength={6} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:border-blue-500 transition-colors"
              value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:bg-blue-400">
            {loading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          มีบัญชีอยู่แล้ว? <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">เข้าสู่ระบบเลย</Link>
        </p>
      </div>
    </main>
  );
}