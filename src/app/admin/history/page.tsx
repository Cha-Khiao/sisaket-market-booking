"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BookingRecord {
  _id: string;
  bookingId: string;
  stallId: string;
  price: number;
  bookingDays: string[];
  status: "pending" | "approved" | "rejected";
  customerName: string;
  customerPhone: string;
  createdAt: string;
}

export default function AdminHistoryPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States สำหรับการค้นหาและฟิลเตอร์
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/admin/bookings");
        const result = await res.json();
        if (result.success) setBookings(result.data);
      } catch (error) {
        toast.error("ดึงข้อมูลประวัติล้มเหลว");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // ดึงรายการเดือนที่มีการจองมาแสดงใน Dropdown
  const availableMonths = Array.from(new Set(bookings.map(b => {
    const d = new Date(b.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }))).sort().reverse();

  const formatMonthTH = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${months[parseInt(month) - 1]} ${parseInt(year) + 543}`; // แปลง ค.ศ. เป็น พ.ศ.
  };

  const formatDateTH = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' น.';
  };

  // ⚡ ประมวลผลการกรองข้อมูล (ค้นหาคำ + เลือกเดือน)
  // ⚡ ประมวลผลการกรองข้อมูล (ดัก Error ข้อมูลเก่าที่ไม่มีชื่อด้วย || "")
  const filteredBookings = bookings.filter(b => {
    const d = new Date(b.createdAt);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const matchMonth = selectedMonth === "all" || monthKey === selectedMonth;
    
    // ใส่ (b... || "") เพื่อป้องกัน Error กรณีข้อมูลในฐานข้อมูลแหว่ง/เก่า
    const matchSearch = 
      (b.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (b.customerPhone || "").includes(searchTerm) || 
      (b.stallId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.bookingId || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchMonth && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));
  const currentData = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="p-10 text-center font-bold dark:text-white animate-pulse">กำลังโหลดประวัติ...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">📂 ประวัติการจองทั้งหมด</h1>
        <p className="text-gray-500 mt-2 font-medium">ค้นหาและดูรายงานย้อนหลังของการจองทั้งหมด</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        
        {/* แถบค้นหาและตัวกรอง */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex flex-col md:flex-row justify-between gap-4">
          
          <div className="relative w-full md:w-96">
            <span className="absolute left-4 top-3 text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ, เบอร์โทร, รหัสล็อก..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold dark:text-white shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             <span className="text-sm font-bold text-gray-500 whitespace-nowrap">เดือนที่ทำรายการ:</span>
             <select 
               value={selectedMonth} 
               onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
               className="w-full md:w-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-sm"
             >
               <option value="all">ดูทั้งหมด</option>
               {availableMonths.map(month => (
                 <option key={month} value={month}>{formatMonthTH(month)}</option>
               ))}
             </select>
          </div>
        </div>

        {/* ตารางประวัติ */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-5 border-b dark:border-gray-800 font-bold">วันที่ / อ้างอิง</th>
                <th className="p-5 border-b dark:border-gray-800 font-bold">ข้อมูลลูกค้า</th>
                <th className="p-5 border-b dark:border-gray-800 font-bold">ล็อกที่จอง</th>
                <th className="p-5 border-b dark:border-gray-800 font-bold">ยอดเงิน</th>
                <th className="p-5 border-b dark:border-gray-800 font-bold text-center pr-6">สถานะสุดท้าย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {currentData.length === 0 ? (
                <tr><td colSpan={5} className="p-16 text-center text-gray-400 font-bold">ไม่พบข้อมูลที่ค้นหา</td></tr>
              ) : (
                currentData.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="p-5">
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-0.5">{formatDateTH(b.createdAt)}</p>
                      <p className="text-xs text-gray-400 font-mono">Ref: {b.bookingId}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-gray-800 dark:text-white">{b.customerName}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">📞 {b.customerPhone}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-black text-gray-800 dark:text-white text-lg">ล็อก {b.stallId}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1.5 bg-blue-50 dark:bg-blue-900/30 inline-block px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-800">
                        รอบจอง: {b.bookingDays && b.bookingDays.length > 0 ? b.bookingDays.map(d => d === 'saturday' ? 'วันเสาร์' : 'วันอาทิตย์').join(', ') : 'ไม่ระบุ'}
                      </p>
                    </td>
                    <td className="p-5 font-mono font-bold text-gray-600 dark:text-gray-300">฿{b.price}</td>
                    <td className="p-5 text-center pr-6">
                      {b.status === "approved" ? (
                         <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-900">✅ อนุมัติแล้ว</span>
                      ) : b.status === "rejected" ? (
                         <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 dark:border-red-900">❌ ปฏิเสธ/ยกเลิก</span>
                      ) : (
                         <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg border border-yellow-200 dark:border-yellow-900">⏳ รอตรวจสอบ</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredBookings.length > 0 && (
          <div className="flex justify-between items-center p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/10">
            <p className="text-sm font-bold text-gray-500">
              หน้า {currentPage} จาก {totalPages} <span className="font-normal text-gray-400 ml-2">({filteredBookings.length} รายการ)</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl font-bold text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors shadow-sm">ก่อนหน้า</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-xl font-bold text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors shadow-sm">ถัดไป</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}