"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Stall {
  _id: string;
  stallId: string;
  zone: string;
  price: number;
  saturday: string;
  sunday: string;
}

export default function AdminStallsPage() {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [formData, setFormData] = useState({ stallId: "", zone: "โซนทั่วไป", price: 100 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchStalls = async () => {
    try {
      const res = await fetch("/api/stalls");
      const result = await res.json();
      if (result.success) setStalls(result.data);
    } catch (error) {
      toast.error("ดึงข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStalls();
  }, []);

  const totalPages = Math.max(1, Math.ceil(stalls.length / itemsPerPage));
  const currentData = stalls.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAddModal = () => {
    setEditingStall(null);
    setFormData({ stallId: "", zone: "โซนทั่วไป", price: 100 });
    setModalOpen(true);
  };

  const openEditModal = (stall: Stall) => {
    setEditingStall(stall);
    setFormData({ stallId: stall.stallId, zone: stall.zone, price: stall.price });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stallId || !formData.zone || formData.price <= 0) return toast.warning("กรุณากรอกข้อมูลให้ครบและถูกต้อง");
    
    setIsProcessing(true);
    const action = editingStall ? "update" : "create";
    const payload = { action, ...formData, id: editingStall?._id };

    try {
      const res = await fetch("/api/admin/stalls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        setModalOpen(false);
        fetchStalls();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/stalls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: deleteConfirm }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setDeleteConfirm(null);
        fetchStalls();
      }
    } catch (error) {
      toast.error("ลบล้มเหลว");
    } finally {
      setIsProcessing(false);
    }
  };

  // ⚡ ฟังก์ชันสำหรับแปลงสถานะเป็นป้ายสี
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "available") return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 font-bold text-xs rounded-lg border border-emerald-100 dark:border-emerald-800">ว่าง</span>;
    if (status === "pending") return <span className="px-2.5 py-1 bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 font-bold text-xs rounded-lg border border-yellow-100 dark:border-yellow-800">รอชำระ</span>;
    return <span className="px-2.5 py-1 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 font-bold text-xs rounded-lg border border-gray-200 dark:border-gray-700">จองแล้ว</span>;
  };

  if (loading) return <div className="p-10 text-center font-bold dark:text-white animate-pulse">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">🗺️ จัดการผังตลาด</h1>
          <p className="text-gray-500 mt-2 font-medium">จัดการพื้นที่ และดูสถานะความว่างของล็อก</p>
        </div>
        <button onClick={openAddModal} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2">
          <span className="text-xl">+</span> สร้างล็อกใหม่
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          <p className="font-bold text-gray-700 dark:text-gray-300">พื้นที่ทั้งหมด <span className="text-blue-600">{stalls.length}</span> ล็อก</p>
          <div className="flex items-center gap-3">
             <span className="text-sm font-bold text-gray-500">แสดงหน้าละ:</span>
             <select 
               value={itemsPerPage} 
               onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
               className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
             >
               <option value={10}>10</option>
               <option value={20}>20</option>
               <option value={50}>50</option>
             </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-5 border-b dark:border-gray-800 font-bold">รหัสล็อก</th>
                <th className="p-5 border-b dark:border-gray-800 font-bold">ชื่อโซน / ราคา</th>
                <th className="p-5 border-b dark:border-gray-800 font-bold text-center">วันเสาร์</th>
                <th className="p-5 border-b dark:border-gray-800 font-bold text-center">วันอาทิตย์</th>
                <th className="p-5 border-b dark:border-gray-800 font-bold text-right pr-6">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {currentData.length === 0 ? (
                <tr><td colSpan={5} className="p-16 text-center text-gray-400 font-bold">ยังไม่มีข้อมูลล็อกพื้นที่</td></tr>
              ) : (
                currentData.map((stall) => (
                  <tr key={stall._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                    <td className="p-5 font-black text-gray-800 dark:text-white text-lg">{stall.stallId}</td>
                    <td className="p-5">
                      <p className={`px-2 py-0.5 rounded-md text-xs font-bold inline-block border mb-1 ${stall.zone.includes("อาหาร") ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/30 dark:border-rose-900 dark:text-rose-400" : stall.zone.includes("เสื้อผ้า") ? "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/30 dark:border-blue-900 dark:text-blue-400" : "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-900 dark:text-emerald-400"}`}>
                        {stall.zone}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">฿{stall.price}</p>
                    </td>
                    <td className="p-5 text-center"><StatusBadge status={stall.saturday} /></td>
                    <td className="p-5 text-center"><StatusBadge status={stall.sunday} /></td>
                    <td className="p-5 text-right pr-6 space-x-2 whitespace-nowrap">
                      <button onClick={() => openEditModal(stall)} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-600 text-gray-600 dark:text-gray-300 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95">✏️ แก้ไข</button>
                      <button onClick={() => setDeleteConfirm(stall._id)} className="px-4 py-2 bg-red-50 border border-red-100 dark:border-red-900/50 hover:bg-red-500 hover:text-white dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95">🗑️ ลบ</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {stalls.length > 0 && (
          <div className="flex justify-between items-center p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/10">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">หน้า {currentPage} จาก {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl font-bold text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 disabled:opacity-40 shadow-sm">ก่อนหน้า</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-xl font-bold text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 disabled:opacity-40 shadow-sm">ถัดไป</button>
            </div>
          </div>
        )}
      </div>

      {/* Popups (เหมือนเดิม) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 border border-gray-100 dark:border-gray-800">
             <h2 className="text-2xl font-black mb-6 dark:text-white text-gray-800">{editingStall ? "แก้ไข" : "สร้างใหม่"}</h2>
             <form onSubmit={handleSave} className="space-y-4">
                <input type="text" value={formData.stallId} onChange={(e) => setFormData({...formData, stallId: e.target.value.toUpperCase()})} placeholder="รหัสล็อก (เช่น A01)" className="w-full p-3 border-2 rounded-xl outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white uppercase font-bold" required />
                <select value={formData.zone} onChange={(e) => setFormData({...formData, zone: e.target.value})} className="w-full p-3 border-2 rounded-xl outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white font-bold cursor-pointer">
                  <option value="โซนอาหาร">โซนอาหาร</option>
                  <option value="โซนเสื้อผ้า">โซนเสื้อผ้า</option>
                  <option value="โซนทั่วไป">โซนทั่วไป</option>
                </select>
                <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} placeholder="ราคา" className="w-full p-3 border-2 rounded-xl outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white font-bold" min="1" required />
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold">ยกเลิก</button>
                  <button type="submit" disabled={isProcessing} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">บันทึก</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-gray-100 dark:border-gray-800">
             <div className="text-5xl mb-4">🗑️</div>
             <h3 className="text-xl font-bold mb-6 dark:text-white">ยืนยันการลบ?</h3>
             <div className="flex gap-2">
               <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold">ยกเลิก</button>
               <button onClick={handleDelete} disabled={isProcessing} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold disabled:opacity-50">ลบเลย</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}