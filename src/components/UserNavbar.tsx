"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function UserNavbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  // ⚡ State สำหรับควบคุม Popup ออกจากระบบ
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname.startsWith("/admin")) return null;

  return (
    <>
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 md:px-8">
        <nav className="pointer-events-auto w-full max-w-6xl flex items-center justify-between px-6 py-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200/50 dark:border-gray-700/50 rounded-2xl transition-all">
          
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <span className="text-2xl">🎪</span>
            </div>
            <div>
              <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 text-xl tracking-tight hidden md:block">
                ตลาดศรีสะเกษ
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium hidden md:block">ระบบจองพื้นที่ออนไลน์</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/booking" className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${pathname === "/booking" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 shadow-sm" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              🗺️ แผนผังจองล็อก
            </Link>
            {session && (
              <Link href="/my-bookings" className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${pathname === "/my-bookings" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 shadow-sm" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                🧾 ประวัติการจอง
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <div className="text-right hidden lg:block mr-2 border-r pr-4 dark:border-gray-700">
                  <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
                    {session.user?.name}
                  </p>
                  <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mt-0.5">
                    📞 {(session.user as any)?.phoneNumber || "ไม่ได้ระบุเบอร์"}
                  </p>
                </div>
                {/* ⚡ เปลี่ยนปุ่มนี้ให้เปิด Popup แทนการ Logout ทันที */}
                <button 
                  onClick={() => setShowLogoutModal(true)} 
                  className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 font-bold text-sm rounded-xl transition-colors"
                >
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <Link href="/login" className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md transition-all">
                เข้าสู่ระบบ
              </Link>
            )}

            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl hover:scale-105 transition-transform text-lg border border-gray-200 dark:border-gray-700">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </nav>
      </div>

      {/* ⚡ Popup ยืนยันการออกจากระบบ (ซ้อนทับทุกสิ่ง) */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="text-5xl text-center mb-4">👋</div>
            <h3 className="text-xl font-bold text-center mb-2 dark:text-white text-gray-800">ต้องการออกจากระบบ?</h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">คุณสามารถเข้าสู่ระบบใหม่ได้ตลอดเวลา</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)} 
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })} 
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}