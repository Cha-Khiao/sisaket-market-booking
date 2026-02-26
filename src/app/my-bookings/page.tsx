"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface BookingRecord {
  _id: string;
  bookingId: string;
  stallId: string;
  price: number;
  bookingDays: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export default function MyBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ⚡ State สำหรับการกรองเดือน
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMyBookings();
    }
  }, [status]);

  const fetchMyBookings = async () => {
    try {
      const res = await fetch("/api/my-bookings"); // อย่าลืมว่าต้องมี API นี้นะครับ
      const result = await res.json();
      if (result.success) {
        setBookings(result.data);
      }
    } catch (error) {
      console.error("ดึงข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  // ⚡ แปลงรูปแบบวันที่เป็น "YYYY-MM" เพื่อใช้ทำ Filter
  const availableMonths = Array.from(new Set(bookings.map(b => {
    const d = new Date(b.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }))).sort().reverse(); // เรียงจากเดือนล่าสุดไปเก่าสุด

  // ฟังก์ชันแปลง "2026-02" เป็น "กุมภาพันธ์ 2026"
  const formatMonthTH = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  // ⚡ ตัวแปรเก็บข้อมูลที่ผ่านการกรองแล้ว
  const filteredBookings = selectedMonth === "all" 
    ? bookings 
    : bookings.filter(b => {
        const d = new Date(b.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
      });

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold dark:text-white">กำลังโหลดข้อมูลประวัติของคุณ...</div>;
  }

  return (
    // ⚡ เพิ่ม pt-36 (Padding Top) เพื่อดันเนื้อหาหนี Navbar ลอยตัว
    <main className="min-h-screen p-6 md:p-12 pt-36 md:pt-36 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white">🧾 ประวัติการจองพื้นที่</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">ดูรายการจองและสถานะการชำระเงินของคุณ</p>
          </div>

          {/* ⚡ Dropdown เลือกเดือน (โชว์เฉพาะถ้ามีประวัติ) */}
          {bookings.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <span className="text-gray-500 pl-2 text-sm">📅 เดือน:</span>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-gray-50 dark:bg-gray-900 border-none text-gray-800 dark:text-white font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
              >
                <option value="all">ทั้งหมด</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>{formatMonthTH(month)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-16 text-center border border-dashed border-gray-300 dark:border-gray-800 shadow-sm">
             <span className="text-5xl block mb-4 opacity-50">📂</span>
             <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">ไม่พบประวัติการจอง</h3>
             <p className="text-gray-500">คุณยังไม่มีประวัติการจองในเดือนที่เลือก</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((record) => (
              <div key={record._id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300">
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl shrink-0 ${
                    record.status === "approved" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : 
                    record.status === "rejected" ? "bg-red-100 text-red-600 dark:bg-red-900/30" : 
                    "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30"
                  }`}>
                    {record.stallId}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5 font-mono">รหัสอ้างอิง: {record.bookingId}</p>
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                      รอบ: {record.bookingDays.map(d => d === 'saturday' ? 'วันเสาร์' : 'วันอาทิตย์').join(', ')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ทำรายการเมื่อ: {new Date(record.createdAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 dark:border-gray-800 gap-2">
                  <p className="text-xl font-black text-orange-600 dark:text-orange-400">฿{record.price}</p>
                  {record.status === "approved" ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-bold text-xs rounded-lg">✅ อนุมัติแล้ว</span>
                  ) : record.status === "rejected" ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 font-bold text-xs rounded-lg">❌ ยกเลิก / ไม่อนุมัติ</span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 font-bold text-xs rounded-lg">⏳ รอแอดมินตรวจสอบ</span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}