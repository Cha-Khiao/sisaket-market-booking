"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BookingRecord {
  _id: string;
  bookingId: string;
  stallId: string;
  price: number;
  bookingDays: string[];
  slipImage?: string; 
  ocrPassed: boolean;
  status: "pending" | "approved" | "rejected";
  customerName: string;
  customerPhone: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ bookingId: string, stallId: string, action: "approve" | "reset" } | null>(null);
  
  // ⚡ State สำหรับระบบลบแบบเข้มงวด (Strict Delete)
  const [strictDeleteModal, setStrictDeleteModal] = useState<{ bookingId: string, stallId: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchBookings = async () => {
    try {
      // ⚡ จุดสำคัญ: เติม ?type=current เข้าไป เพื่อบังคับดึงเฉพาะบิลของรอบปัจจุบัน
      const res = await fetch("/api/admin/bookings?type=current");
      const result = await res.json();
      if (result.success) {
        setBookings(result.data);
      }
    } catch (error) {
      toast.error("ดึงข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 5000); 
    return () => clearInterval(interval);
  }, []);

  const executeAction = async (bookingId: string, stallId: string, action: "approve" | "reset") => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, stallId, action }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setConfirmModal(null); 
        setStrictDeleteModal(null);
        setConfirmText("");
        fetchBookings(); 
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold dark:text-white">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">📝 ตรวจสอบและจัดการสลิป</h1>
        <p className="text-gray-500 mt-1">ตรวจสอบการชำระเงิน และจัดการสถานะการจองของลูกค้า</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm">
                <th className="p-4 border-b dark:border-gray-700">อ้างอิง / ลูกค้า</th>
                <th className="p-4 border-b dark:border-gray-700">ล็อก / รอบการจอง</th>
                <th className="p-4 border-b dark:border-gray-700 text-center">หลักฐานสลิป</th>
                <th className="p-4 border-b dark:border-gray-700 text-center">สถานะ</th>
                <th className="p-4 border-b dark:border-gray-700 text-right pr-6">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {bookings.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">ยังไม่มีรายการ</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <p className="text-xs text-gray-400 font-mono mb-0.5">{b.bookingId}</p>
                      <p className="font-bold text-gray-800 dark:text-white">{b.customerName}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">📞 {b.customerPhone}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-black text-gray-800 dark:text-white text-lg">
                        ล็อก {b.stallId} <span className="text-gray-400 font-medium text-sm ml-1">(฿{b.price})</span>
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1.5 bg-blue-50 dark:bg-blue-900/30 inline-block px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-800">
                        รอบจอง: {b.bookingDays && b.bookingDays.length > 0 ? b.bookingDays.map(d => d === 'saturday' ? 'เสาร์' : 'อาทิตย์').join(' และ ') : 'ไม่ระบุ'}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      {b.slipImage && b.slipImage.startsWith('data:image') ? (
                        <button onClick={() => setSelectedSlip(b.slipImage || null)} className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 font-bold text-xs rounded-lg transition-colors">
                          👁️ ดูรูปสลิป
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">- ไม่มีสลิป -</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {b.status === "approved" ? (
                         <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">✅ อนุมัติแล้ว</span>
                      ) : b.status === "rejected" ? (
                         <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">❌ ยกเลิกแล้ว</span>
                      ) : b.ocrPassed ? (
                         <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">AI ผ่าน</span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg animate-pulse">รอแอดมินตรวจ</span>
                      )}
                    </td>
                    <td className="p-4 text-right pr-6 space-x-2">
                      {b.status === "pending" && (
                        <button onClick={() => setConfirmModal({ bookingId: b.bookingId, stallId: b.stallId, action: "approve" })} className="px-4 py-2 bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">
                          ✓ อนุมัติ
                        </button>
                      )}
                      
                      {/* ปุ่มยกเลิก/ลบ ถ้าสถานะเป็น approve จะเรียก Strict Modal สีแดง */}
                      {b.status !== "rejected" && (
                        <button 
                          onClick={() => {
                            if (b.status === "approved") {
                              setStrictDeleteModal({ bookingId: b.bookingId, stallId: b.stallId });
                            } else {
                              setConfirmModal({ bookingId: b.bookingId, stallId: b.stallId, action: "reset" });
                            }
                          }} 
                          className="px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 dark:bg-gray-800 dark:hover:bg-red-900/30 dark:text-gray-400 font-bold text-xs rounded-lg transition-colors"
                        >
                          ✕ ปฏิเสธ/ยกเลิก
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ⚡ Popup อนุมัติ/ปฏิเสธ ทั่วไป */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95">
            <div className="text-5xl text-center mb-4">{confirmModal.action === "approve" ? "✅" : "⚠️"}</div>
            <h3 className="text-xl font-bold text-center mb-2 dark:text-white">
              {confirmModal.action === "approve" ? "ยืนยันการอนุมัติสลิป?" : "ปฏิเสธสลิปนี้ใช่หรือไม่?"}
            </h3>
            <p className="text-center text-gray-500 mb-8 text-sm">การดำเนินการนี้จะอัปเดตสถานะของล็อกพื้นที่ด้วย</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} disabled={isProcessing} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">ยกเลิก</button>
              <button onClick={() => executeAction(confirmModal.bookingId, confirmModal.stallId, confirmModal.action)} disabled={isProcessing} className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 ${confirmModal.action === "approve" ? "bg-emerald-500 shadow-emerald-500/30" : "bg-red-500 shadow-red-500/30"}`}>
                {isProcessing ? "กำลังทำงาน..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 Strict Delete Modal (สำหรับลบรายการที่อนุมัติไปแล้ว) */}
      {strictDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-md w-full border-2 border-red-500 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🚨</div>
            <h3 className="text-2xl font-bold text-center mb-2 text-red-600 dark:text-red-500">การยกเลิกพื้นที่ที่อนุมัติแล้ว!</h3>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6 text-sm">
              รายการนี้ <span className="font-bold">ลูกค้าชำระเงินและได้รับการอนุมัติแล้ว</span> หากคุณยกเลิก ระบบจะดึงพื้นที่กลับมาให้คนอื่นจองได้ 
            </p>
            
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl mb-6">
               <label className="block text-sm font-bold text-red-800 dark:text-red-300 mb-2">เพื่อป้องกันความผิดพลาด กรุณาพิมพ์คำว่า <span className="bg-white dark:bg-black px-2 py-1 rounded select-all font-mono">ยืนยัน</span> ลงในช่องด้านล่าง</label>
               <input 
                 type="text" 
                 value={confirmText}
                 onChange={(e) => setConfirmText(e.target.value)}
                 className="w-full p-3 border-2 border-red-300 dark:border-red-800 rounded-lg outline-none focus:border-red-500 bg-white dark:bg-gray-800 dark:text-white text-center font-bold"
                 placeholder="พิมพ์คำว่า ยืนยัน"
               />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setStrictDeleteModal(null); setConfirmText(""); }} disabled={isProcessing} className="flex-1 py-3.5 bg-gray-200 text-gray-800 rounded-xl font-bold">ปิดหน้าต่าง</button>
              <button 
                onClick={() => executeAction(strictDeleteModal.bookingId, strictDeleteModal.stallId, "reset")} 
                disabled={isProcessing || confirmText !== "ยืนยัน"} 
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/40 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
              >
                {isProcessing ? "กำลังยกเลิก..." : "ยืนยันการยึดคืนพื้นที่"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup ดูรูปสลิป */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-2xl max-w-sm w-full relative">
            <button onClick={() => setSelectedSlip(null)} className="absolute -top-4 -right-4 w-10 h-10 bg-gray-800 text-white rounded-full font-bold text-xl hover:bg-gray-700">✕</button>
            <h3 className="text-center font-bold mb-4 dark:text-white">หลักฐานการโอนเงิน</h3>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center p-2 min-h-[300px]">
              <img src={selectedSlip} alt="Slip" className="max-h-[60vh] object-contain rounded-lg shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}