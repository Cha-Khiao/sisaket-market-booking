"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdownText, setCountdownText] = useState("");

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authText, setAuthText] = useState("");
  
  // State สำหรับปุ่มล้างกระดานฉุกเฉิน
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetAuthText, setResetAuthText] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const result = await res.json();
        if (result.success && result.data) {
          setIsOpen(result.data.isOpen);
          if (result.data.openTime) setOpenTime(new Date(result.data.openTime).toISOString().slice(0, 16));
          if (result.data.closeTime) setCloseTime(new Date(result.data.closeTime).toISOString().slice(0, 16));
        }
      } catch (error) {
        toast.error("ดึงข้อมูลการตั้งค่าล้มเหลว");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!openTime || !closeTime) {
        setCountdownText("ยังไม่ได้กำหนดเวลา");
        return;
      }
      const now = new Date().getTime();
      const open = new Date(openTime).getTime();
      const close = new Date(closeTime).getTime();

      if (now < open) {
        const diff = open - now;
        setCountdownText(`ระบบจะล้างกระดานและเปิดรับจองในอีก ${formatTimeDiff(diff)}`);
      } else if (now >= open && now <= close) {
        const diff = close - now;
        setCountdownText(`ระบบเปิดอยู่ จะปิดในอีก ${formatTimeDiff(diff)}`);
      } else {
        setCountdownText("หมดเวลารับจองแล้ว (ระบบปิดอัตโนมัติ)");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [openTime, closeTime]);

  const formatTimeDiff = (ms: number) => {
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    return `${d > 0 ? `${d} วัน ` : ''}${h} ชม. ${m} นาที ${s} วินาที`;
  };

  const handleSaveTimer = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_timer", isOpen, openTime, closeTime }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowAuthModal(false); 
        setAuthText(""); 
      } else toast.error(data.message);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualReset = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_board" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowResetModal(false); 
        setResetAuthText(""); 
      } else toast.error(data.message);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">กำลังโหลดการตั้งค่า...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">⚙️ ตั้งค่าระบบจองพื้นที่</h1>
        <p className="text-gray-500 mt-2 font-medium">จัดการเวลาเปิด-ปิดตลาด (ระบบจะล้างกระดานอัตโนมัติเมื่อถึงเวลาเปิดรอบใหม่)</p>
      </div>

      {/* 1. ส่วนตั้งเวลา (ตั้งเวลาเสร็จ รอเวลาเดิน มันจะล้างเอง) */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-8 mb-8 relative overflow-hidden">
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
           <div>
             <p className="text-blue-800 dark:text-blue-400 font-bold mb-1">สถานะเวลาปัจจุบัน</p>
             <p className="text-lg md:text-xl font-mono font-black text-blue-600 dark:text-blue-500">{countdownText}</p>
           </div>
           <div className="text-5xl animate-pulse">⏳</div>
        </div>

        <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-6">
          <div>
            <h2 className="text-xl font-bold dark:text-white">เปิด/ปิด ระบบแมนนวล (Override)</h2>
            <p className="text-sm text-gray-500 mt-1">ใช้ปิดระบบทันที โดยไม่สนเวลาที่ตั้งไว้</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">เวลาเปิดรับจอง (Auto-Reset)</label>
            <input type="datetime-local" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="w-full p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-2 font-bold">✅ เมื่อถึงเวลานี้ ระบบจะล้างกระดานให้อัตโนมัติ</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">เวลาปิดรับจอง</label>
            <input type="datetime-local" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="w-full p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
          </div>
        </div>

        <button onClick={() => setShowAuthModal(true)} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex justify-center items-center gap-2">
          <span>🔒</span> ยืนยันเพื่อบันทึกการตั้งค่าเวลา
        </button>
      </div>

      {/* 2. ปุ่มล้างกระดานฉุกเฉิน (Manual Reset) */}
      <div className="bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-900/50 p-8">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-500 mb-2">🚨 ล้างกระดานแมนนวล (ฉุกเฉิน)</h2>
        <p className="text-red-800/70 dark:text-red-300/70 text-sm mb-6 max-w-2xl font-medium">
          ระบบมีการตั้งเวลาล้างกระดานอัตโนมัติอยู่แล้ว แต่ถ้าคุณต้องการ <b>เคลียร์พื้นที่ให้ว่างทันทีเดี๋ยวนี้</b> สามารถกดปุ่มด้านล่างได้เลย
        </p>
        <button onClick={() => setShowResetModal(true)} className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all">
          ⚠️ ล้างพื้นที่ทั้งหมดให้ว่างทันที
        </button>
      </div>

      {/* Popup ยืนยันตั้งเวลา */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🛡️</div>
            <h3 className="text-2xl font-black text-center mb-2 dark:text-white">ยืนยันสิทธิ์ผู้ดูแล</h3>
            <p className="text-center text-gray-500 text-sm mb-6">พิมพ์ <span className="font-bold text-blue-600">ยืนยัน</span> เพื่อตั้งเวลา</p>
            <input type="text" value={authText} onChange={(e) => setAuthText(e.target.value)} className="w-full p-3.5 mb-6 border-2 border-gray-200 rounded-xl text-center font-bold outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="พิมพ์ที่นี่" />
            <div className="flex gap-3">
              <button onClick={() => setShowAuthModal(false)} className="flex-1 py-3.5 bg-gray-100 rounded-xl font-bold dark:bg-gray-800 dark:text-white">ยกเลิก</button>
              <button onClick={handleSaveTimer} disabled={isProcessing || authText !== "ยืนยัน"} className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50">บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup ยืนยันล้างกระดาน */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full border-2 border-red-500 animate-in zoom-in-95">
            <div className="text-5xl text-center mb-4">💣</div>
            <h3 className="text-2xl font-black text-center mb-2 text-red-600">ยืนยันการล้างกระดาน?</h3>
            <p className="text-center text-gray-600 text-sm mb-6 dark:text-gray-400">พื้นที่ทั้งหมดจะว่างทันที พิมพ์ <span className="font-bold text-red-600">ล้างกระดาน</span> เพื่อดำเนินการ</p>
            <input type="text" value={resetAuthText} onChange={(e) => setResetAuthText(e.target.value)} className="w-full p-3.5 mb-6 border-2 border-red-200 rounded-xl text-center font-bold outline-none focus:border-red-500 dark:bg-gray-800 dark:border-red-800 dark:text-white" placeholder="พิมพ์ที่นี่" />
            <div className="flex gap-3">
              <button onClick={() => setShowResetModal(false)} className="flex-1 py-3.5 bg-gray-100 rounded-xl font-bold dark:bg-gray-800 dark:text-white">ยกเลิก</button>
              <button onClick={handleManualReset} disabled={isProcessing || resetAuthText !== "ล้างกระดาน"} className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-xl disabled:opacity-50">ล้างทันที</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}