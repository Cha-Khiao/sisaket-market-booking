"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // ⚡ State สำหรับ Popup ออกจากระบบ
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950">
      <aside className="w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed h-full z-20 shadow-sm">
        
        <div className="h-24 flex items-center px-8 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500 tracking-tight">
              Market Admin
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Control Center</p>
          </div>
        </div>
        
        <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
          <Link href="/admin" className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 ${pathname === "/admin" ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/50"}`}>
            <span className="text-xl">📊</span> ภาพรวมระบบ
          </Link>
          <Link href="/admin/bookings" className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 ${pathname === "/admin/bookings" ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/50"}`}>
            <span className="text-xl">📝</span> ตรวจสอบสลิป (รอบปัจจุบัน)
          </Link>
          <Link href="/admin/history" className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 ${pathname === "/admin/history" ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/50"}`}>
            <span className="text-xl">📂</span> ประวัติย้อนหลังทั้งหมด
          </Link>
          <Link href="/admin/stalls" className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 ${pathname === "/admin/stalls" ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/50"}`}>
            <span className="text-xl">🗺️</span> จัดการผังตลาด
          </Link>
          <Link href="/admin/settings" className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 ${pathname === "/admin/settings" ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/50"}`}>
            <span className="text-xl">⚙️</span> ตั้งค่ารอบการจอง
          </Link>
        </nav>

        <div className="p-5 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md">👑</div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{session?.user?.name || "Admin"}</p>
                 <p className="text-[10px] text-gray-500 uppercase font-bold">Administrator</p>
              </div>
              {mounted && (
                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:scale-105 transition-all text-sm shadow-sm">
                  {theme === "dark" ? "☀️" : "🌙"}
                </button>
              )}
           </div>
           
           {/* ⚡ ปุ่มเปิด Popup ออกจากระบบ */}
           <button onClick={() => setShowLogoutModal(true)} className="w-full py-3 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 font-bold rounded-xl transition-all shadow-sm flex justify-center items-center gap-2">
             <span className="text-lg">🚪</span> ออกจากระบบ
           </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-8 lg:p-12">
        {children}
      </main>

      {/* ⚡ Popup ยืนยันการออกจากระบบของ Admin */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100 dark:border-gray-800 animate-in zoom-in-95">
            <div className="text-5xl text-center mb-4">👋</div>
            <h3 className="text-xl font-bold text-center mb-2 dark:text-white text-gray-800">ยืนยันการออกจากระบบ?</h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">คุณต้องเข้าสู่ระบบใหม่ในครั้งถัดไป</p>
            
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors">ยกเลิก</button>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-colors">ออกจากระบบ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}