"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300 relative overflow-hidden">
      
      {/* ปุ่มสลับโหมดมืด/สว่างมุมขวาบน */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
          className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-md hover:scale-110 transition-transform"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      {/* วงกลมตกแต่งฉากหลัง */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300/30 dark:bg-blue-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-green-300/30 dark:bg-green-600/20 rounded-full blur-3xl"></div>

      {/* Content หลัก */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="mb-6 inline-block">
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider shadow-sm">
            ✨ เปิดจองพื้นที่แล้ววันนี้
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight drop-shadow-sm">
          ตลาดนัดคนเดิน <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 dark:from-blue-400 dark:to-green-400">
            จังหวัดศรีสะเกษ
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          ยินดีต้อนรับพ่อค้าแม่ค้าทุกท่านเข้าสู่ระบบจองล็อกออนไลน์ 
          ตรวจสอบผังเมือง เลือกล็อกที่ถูกใจ และชำระเงินอัตโนมัติได้ตลอด 24 ชั่วโมง 
          สะดวกรวดเร็ว ไม่ต้องรอคิว
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/booking">
            <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-2xl shadow-xl shadow-blue-500/30 hover:-translate-y-1 transition-all">
              🚀 เข้าสู่ระบบจองล็อก
            </button>
          </Link>
          <button className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-lg font-bold rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            📖 วิธีการจอง
          </button>
        </div>
      </div>
    </main>
  );
}