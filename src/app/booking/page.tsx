"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import Tesseract from "tesseract.js";
import { QRCodeSVG } from "qrcode.react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Stall {
  _id: string;
  stallId: string;
  zone: string;
  saturday: "available" | "pending" | "booked";
  sunday: "available" | "pending" | "booked";
  price: number;
}

export default function BookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [viewDay, setViewDay] = useState<"saturday" | "sunday">("saturday");
  const [selectedStallForOptions, setSelectedStallForOptions] = useState<Stall | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const [hoveredStall, setHoveredStall] = useState<Stall | null>(null);
  const [checkoutStall, setCheckoutStall] = useState<Stall | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); 
  
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [sysOpen, setSysOpen] = useState({ isOpen: true, openTime: null });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("กรุณาเข้าสู่ระบบก่อนเข้าใช้งาน");
      router.push("/login");
    }
  }, [status, router]);

  const fetchStalls = async () => {
    try {
      const res = await fetch("/api/stalls");
      const result = await res.json();
      if (result.success) {
        setStalls(result.data);
        setSysOpen(result.system); // 👈 เพิ่มบรรทัดนี้
      }
    } catch (error) {
      toast.error("ไม่สามารถเชื่อมต่อฐานข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (status === "authenticated") {
      fetchStalls();
      const interval = setInterval(fetchStalls, 5000);
      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    if (checkoutStall && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && checkoutStall) {
      toast.error("หมดเวลาชำระเงิน ระบบได้ยกเลิกรายการของคุณแล้ว");
      handleCancelBooking(checkoutStall.stallId);
    }
    return () => clearTimeout(timerRef.current!);
  }, [timeLeft, checkoutStall]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopyPromptPay = () => {
    navigator.clipboard.writeText("0812345678");
    toast.success("คัดลอกเลขพร้อมเพย์เรียบร้อยแล้ว");
  };

  const handleOpenDaySelection = (stallId: string) => {
    const stall = stalls.find((s) => s.stallId === stallId);
    if (!stall) return;
    setSelectedStallForOptions(stall);
    setSelectedDays([]);
  };

  const handleConfirmDaysAndBook = async () => {
    if (!selectedStallForOptions || selectedDays.length === 0) {
      return toast.warning("กรุณาเลือกรอบวันที่ต้องการจอง");
    }

    const realUserId = (session?.user as any)?.id;

    toast.promise(
      fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stallId: selectedStallForOptions.stallId, userId: realUserId, days: selectedDays }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        return data;
      }),
      {
        loading: "กำลังล็อกพื้นที่...",
        success: () => {
          fetchStalls();
          setCheckoutStall(selectedStallForOptions);
          setSelectedStallForOptions(null);
          setTimeLeft(900);
          setSlipFile(null);
          setSlipPreview(null);
          return "ล็อกพื้นที่สำเร็จ กรุณาชำระเงิน";
        },
        error: (err) => `${err.message}`,
      }
    );
  };

  const handleCancelBooking = async (stallIdToCancel?: string) => {
    try {
       const targetStallId = stallIdToCancel || checkoutStall?.stallId;
       
       if (targetStallId && selectedDays.length > 0) {
         await fetch("/api/bookings/cancel", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ stallId: targetStallId, days: selectedDays }),
         });
       }

       if (stallIdToCancel || checkoutStall) toast.info("ยกเลิกรายการและคืนพื้นที่เรียบร้อยแล้ว");
       
       setCheckoutStall(null);
       setSelectedStallForOptions(null);
       setSelectedDays([]);
       setSlipFile(null);
       setSlipPreview(null);
       fetchStalls(); 
    } catch (error) {
       console.error("Cancel Error", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setSlipFile(file);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setSlipPreview(reader.result as string);
  };

  const handleSubmitSlip = async () => {
    if (!slipFile || !slipPreview || !checkoutStall) return;

    setIsUploading(true);
    toast.loading("กำลังตรวจสอบสลิป...");

    try {
      const result = await Tesseract.recognize(slipFile, "tha+eng");
      const text = result.data.text;

      const expectedPrice = checkoutStall.price * selectedDays.length;
      const realUserId = (session?.user as any)?.id; 
      const ocrPassed = text.includes(expectedPrice.toString());

      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stallId: checkoutStall.stallId, 
          userId: realUserId, 
          price: expectedPrice,
          slipImage: slipPreview, 
          ocrPassed: ocrPassed,
          days: selectedDays
        }),
      });

      const data = await res.json();
      toast.dismiss(); 

      if (res.ok) {
        if (ocrPassed) {
          toast.success("ชำระเงินสำเร็จ! อนุมัติการจองเรียบร้อย");
        } else {
          toast.success("ส่งหลักฐานสำเร็จ! กรุณารอเจ้าหน้าที่ตรวจสอบ");
        }
        
        setCheckoutStall(null);
        setSelectedDays([]);
        setSlipFile(null);
        setSlipPreview(null);
        fetchStalls();
      } else {
         toast.error(data.message || "เกิดข้อผิดพลาดในการส่งข้อมูล");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("เกิดข้อผิดพลาดในการอ่านรูปภาพ กรุณาลองใหม่");
    } finally {
      setIsUploading(false);
    }
  };

  const getBlockStyle = (status: string, zone: string) => {
    if (status === "pending") return "bg-yellow-400 border-yellow-500 text-yellow-900 shadow-inner";
    if (status === "booked") return "bg-gray-300 border-gray-400 text-gray-500 opacity-60 cursor-not-allowed";
    if (zone.includes("อาหาร")) return "bg-rose-500 border-rose-600 text-white shadow-sm"; 
    if (zone.includes("เสื้อผ้า")) return "bg-blue-500 border-blue-600 text-white shadow-sm"; 
    return "bg-emerald-500 border-emerald-600 text-white shadow-sm"; 
  };
  
  const leftStalls = stalls.filter((s) => s.zone.includes("อาหาร"));
  const rightStalls = stalls.filter((s) => !s.zone.includes("อาหาร"));
  const availableStalls = stalls.filter(s => s[viewDay] === "available");

  if (status === "loading" || !mounted) return <div className="min-h-screen flex items-center justify-center text-xl font-bold dark:text-white transition-opacity duration-300">กำลังโหลดข้อมูล...</div>;
  if (status === "unauthenticated") return null;
  if (!sysOpen.isOpen) {
    return (
      <main className="min-h-screen p-6 flex flex-col items-center justify-center bg-gray-900 text-white text-center">
        <div className="bg-gray-800 p-12 rounded-[3rem] shadow-2xl max-w-lg w-full border border-gray-700">
           <span className="text-6xl mb-6 block animate-bounce">⏳</span>
           <h1 className="text-3xl font-black mb-3">ระบบยังไม่เปิดรับจอง</h1>
           <p className="text-gray-400 font-medium leading-relaxed">กรุณารอจนกว่าจะถึงเวลาเปิดรับจองในรอบถัดไป</p>
           {sysOpen.openTime && (
             <div className="mt-8 p-4 bg-gray-900 rounded-2xl border border-gray-700">
                <p className="text-sm text-gray-500 mb-1">ระบบจะเปิดอัตโนมัติในวันที่</p>
                <p className="text-xl font-bold text-orange-500">
                  {new Date(sysOpen.openTime).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })} น.
                </p>
             </div>
           )}
           <Link href="/" className="inline-block mt-8 px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-colors">กลับหน้าแรก</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-12 pt-32 md:pt-32 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">

        {/* แถบสลับวัน */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-200/80 dark:bg-gray-800 p-1.5 rounded-full shadow-inner border border-gray-300/50 dark:border-gray-700">
            <button 
              onClick={() => setViewDay("saturday")}
              className={`px-8 py-2.5 rounded-full font-bold transition-all duration-300 ${viewDay === "saturday" ? "bg-orange-600 text-white shadow-md dark:bg-orange-500 dark:text-gray-950" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50"}`}
            >
              วันเสาร์
            </button>
            <button 
              onClick={() => setViewDay("sunday")}
              className={`px-8 py-2.5 rounded-full font-bold transition-all duration-300 ${viewDay === "sunday" ? "bg-orange-600 text-white shadow-md dark:bg-orange-500 dark:text-gray-950" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50"}`}
            >
              วันอาทิตย์
            </button>
          </div>
        </div>

        {/* แผนที่ */}
        <div className="relative bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-700 max-w-4xl mx-auto mb-16 overflow-hidden transition-all duration-300">
          <div className="text-center mb-8">
             <span className="bg-gray-800 dark:bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold shadow-md tracking-wide text-sm">🗺️ แผนผังตลาดนัด</span>
          </div>
          <div className="flex justify-center gap-4 relative">
             <div className="grid grid-cols-2 gap-4">
                {leftStalls.map((stall) => <StallViewOnly key={stall._id} stall={stall} />)}
              </div>
              <div className="w-24 bg-gray-100 dark:bg-slate-700 rounded-xl relative flex justify-center shadow-inner border border-gray-200 dark:border-slate-600 min-h-[300px]">
                <div className="w-2 h-full bg-[linear-gradient(to_bottom,#cbd5e1_50%,transparent_50%)] bg-[length:100%_60px] opacity-50"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {rightStalls.map((stall) => <StallViewOnly key={stall._id} stall={stall} />)}
              </div>
          </div>

          {/* Tooltip สมูทๆ พร้อมคำใบ้ให้คลิก */}
          {hoveredStall && (
              <div className="absolute top-4 left-4 z-40 bg-white/95 dark:bg-gray-800/95 p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-700 backdrop-blur-md pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold mb-1 dark:text-white text-gray-800">ล็อก {hoveredStall.stallId}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">โซน: {hoveredStall.zone}</p>
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">ราคา: ฿{hoveredStall.price} / วัน</p>
                <div className="mt-3 text-sm border-t pt-3 border-gray-100 dark:border-gray-700 space-y-1">
                  <p className="flex justify-between gap-4">เสาร์: <span className={hoveredStall.saturday === "available" ? "text-emerald-500 font-bold" : "text-gray-400"}>{hoveredStall.saturday === "available" ? "ว่าง" : "จองแล้ว"}</span></p>
                  <p className="flex justify-between gap-4">อาทิตย์: <span className={hoveredStall.sunday === "available" ? "text-emerald-500 font-bold" : "text-gray-400"}>{hoveredStall.sunday === "available" ? "ว่าง" : "จองแล้ว"}</span></p>
                </div>
                {/* คำใบ้บอกว่ากดจองได้ */}
                {hoveredStall[viewDay] === "available" && (
                  <div className="mt-3 pt-2 text-center border-t border-dashed border-gray-200 dark:border-gray-600">
                     <p className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-900/20 py-1.5 rounded-lg">
                       👆 คลิกเพื่อจองล็อกนี้
                     </p>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* รายการล็อกที่ว่าง */}
        <div className="transition-all duration-300">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
              <h2 className="text-2xl font-bold dark:text-white text-gray-800">
                เลือกล็อกที่ต้องการจอง ({viewDay === "saturday" ? "วันเสาร์" : "วันอาทิตย์"})
              </h2>
           </div>
           
           {availableStalls.length === 0 ? (
             <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-dashed border-gray-300 dark:border-gray-800">
                <span className="text-4xl block mb-3 opacity-50">🛒</span>
                ขออภัย ไม่มีพื้นที่ว่างในรอบนี้
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
               {availableStalls.map((stall) => (
                 <div key={stall._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 group hover:-translate-y-1">
                   <div className={`h-28 w-full flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-500 ease-out ${stall.zone.includes("อาหาร") ? "bg-rose-50 dark:bg-rose-900/20" : stall.zone.includes("เสื้อผ้า") ? "bg-blue-50 dark:bg-blue-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"}`}>
                      {stall.zone.includes("อาหาร") ? "🍜" : stall.zone.includes("เสื้อผ้า") ? "👕" : "📦"}
                   </div>
                   <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                         <h3 className="text-xl font-bold dark:text-white text-gray-800">ล็อก {stall.stallId}</h3>
                         <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-emerald-900/40 dark:text-emerald-400">ว่าง</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">โซน: {stall.zone}</p>
                      <p className="text-lg font-black text-orange-600 dark:text-orange-400 mb-4">฿{stall.price} <span className="text-sm text-gray-400 font-normal">/ วัน</span></p>
                      
                      <button 
                        onClick={() => handleOpenDaySelection(stall.stallId)}
                        className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-500 dark:hover:bg-orange-400 dark:text-gray-950 font-extrabold rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
                      >
                        จองพื้นที่นี้
                      </button>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* Popup: Modal เลือกรอบการจอง */}
        {selectedStallForOptions && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800 flex flex-col">
              <h2 className="text-2xl font-bold mb-1 dark:text-white text-gray-800">เลือกรอบการจอง</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">ล็อก {selectedStallForOptions.stallId} • {selectedStallForOptions.zone}</p>
              
              <div className="space-y-3 mb-6">
                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedStallForOptions.saturday !== "available" ? "opacity-50 bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-800 cursor-not-allowed" : selectedDays.includes("saturday") ? "border-orange-500 bg-orange-50/50 dark:border-orange-500/50 dark:bg-orange-900/10" : "border-gray-200 hover:border-orange-300 dark:border-gray-700 dark:hover:border-gray-600"}`}>
                  <input type="checkbox" className="w-5 h-5 accent-orange-500 cursor-pointer disabled:cursor-not-allowed" 
                    disabled={selectedStallForOptions.saturday !== "available"}
                    checked={selectedDays.includes("saturday")}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedDays([...selectedDays, "saturday"]);
                      else setSelectedDays(selectedDays.filter(d => d !== "saturday"));
                    }} 
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 dark:text-white text-lg">วันเสาร์</p>
                    {selectedStallForOptions.saturday !== "available" && <p className="text-xs text-red-500 mt-0.5 font-bold">ไม่ว่าง</p>}
                  </div>
                  <span className="font-bold text-gray-600 dark:text-gray-300">฿{selectedStallForOptions.price}</span>
                </label>

                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedStallForOptions.sunday !== "available" ? "opacity-50 bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-800 cursor-not-allowed" : selectedDays.includes("sunday") ? "border-orange-500 bg-orange-50/50 dark:border-orange-500/50 dark:bg-orange-900/10" : "border-gray-200 hover:border-orange-300 dark:border-gray-700 dark:hover:border-gray-600"}`}>
                  <input type="checkbox" className="w-5 h-5 accent-orange-500 cursor-pointer disabled:cursor-not-allowed" 
                    disabled={selectedStallForOptions.sunday !== "available"}
                    checked={selectedDays.includes("sunday")}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedDays([...selectedDays, "sunday"]);
                      else setSelectedDays(selectedDays.filter(d => d !== "sunday"));
                    }} 
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 dark:text-white text-lg">วันอาทิตย์</p>
                    {selectedStallForOptions.sunday !== "available" && <p className="text-xs text-red-500 mt-0.5 font-bold">ไม่ว่าง</p>}
                  </div>
                  <span className="font-bold text-gray-600 dark:text-gray-300">฿{selectedStallForOptions.price}</span>
                </label>
              </div>

              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-6 border border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300 font-bold">ยอดรวม</span>
                <span className="text-2xl font-black text-orange-600 dark:text-orange-400">฿{selectedStallForOptions.price * selectedDays.length}</span>
              </div>

              <div className="flex gap-4 mt-auto">
                <button onClick={() => handleCancelBooking()} className="w-1/2 py-3.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors">
                  ยกเลิก
                </button>
                <button 
                  onClick={handleConfirmDaysAndBook} 
                  className="w-1/2 py-3.5 bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-500 dark:text-gray-950 dark:hover:bg-orange-400 rounded-xl font-extrabold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={selectedDays.length === 0}
                >
                  ยืนยันรอบจอง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popup: ชำระเงิน */}
        {checkoutStall && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 p-8 md:p-10 rounded-[2rem] shadow-2xl max-w-3xl w-full animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col">
               
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-5 gap-4 shrink-0">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ชำระเงินค่าล็อก {checkoutStall.stallId}</h2>
                    <p className="text-orange-600 dark:text-orange-400 font-bold mt-1">
                      รอบการจอง: {selectedDays.map(d => d === "saturday" ? "วันเสาร์" : "วันอาทิตย์").join(", ")}
                    </p>
                  </div>
                  <div className="text-right bg-rose-50 dark:bg-rose-900/30 px-4 py-2 rounded-xl border border-rose-100 dark:border-rose-900/50">
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-1">เวลาทำรายการ</p>
                    <p className={`text-2xl font-mono font-black tracking-tight ${timeLeft < 300 ? "text-rose-600 animate-pulse" : "text-rose-500"}`}>
                      {formatTime(timeLeft)}
                    </p>
                  </div>
               </div>

               <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center mb-6 overflow-y-auto">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center w-full md:w-auto h-fit shrink-0">
                    <p className="font-bold mb-4 text-gray-800 dark:text-white text-sm">สแกน QR Code</p>
                    <div className="bg-white p-3 rounded-xl shadow-sm mb-4 border border-gray-100">
                       <QRCodeSVG value={`PROMPTPAY:0812345678|AMOUNT:${checkoutStall.price * selectedDays.length}`} size={140} />
                    </div>
                    
                    <div className="w-full">
                       <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 font-medium">หรือโอนเข้าบัญชี / พร้อมเพย์</p>
                       <div className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                          <span className="font-mono font-bold text-gray-800 dark:text-white ml-2">
                            081-234-5678
                          </span>
                          <button 
                            onClick={handleCopyPromptPay} 
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-white rounded-md text-xs font-bold transition-colors"
                          >
                            คัดลอก
                          </button>
                       </div>
                    </div>

                    <div className="mt-4 w-full text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ยอดสุทธิ</p>
                      <p className="text-2xl font-black text-orange-600 dark:text-orange-400">฿{checkoutStall.price * selectedDays.length}</p>
                    </div>
                  </div>

                  <div className="flex-1 w-full flex flex-col h-full min-h-[250px]">
                    {!slipPreview ? (
                      <>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 mb-4">
                          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
                            💡 ระบบจะตรวจสอบยอดเงินอัตโนมัติ หากยอดตรงจะ <span className="font-bold">อนุมัติการจองทันที</span>
                          </p>
                        </div>
                        <label className="block w-full cursor-pointer group flex-1 h-full">
                          <div className="h-full bg-white dark:bg-gray-800/50 border-2 border-dashed border-gray-300 hover:border-emerald-500 dark:border-gray-600 dark:hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center transition-colors">
                            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 transition-colors">
                               <span className="text-2xl">📤</span>
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-300">คลิกเพื่ออัปโหลดสลิป</span>
                            <span className="text-xs text-gray-400 mt-1">ไฟล์ JPG หรือ PNG</span>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                        </label>
                      </>
                    ) : (
                      <div className="flex flex-col h-full animate-in fade-in duration-200">
                        <div className="flex justify-between items-center mb-2">
                           <p className="font-bold text-gray-800 dark:text-white">ภาพหลักฐาน</p>
                           <button onClick={() => { setSlipPreview(null); setSlipFile(null); }} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-bold transition-colors">
                             เปลี่ยนรูป
                           </button>
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center p-2 relative border border-gray-200 dark:border-gray-700 min-h-[200px]">
                          <img src={slipPreview} alt="Slip" className="max-h-[240px] object-contain rounded-lg" />
                        </div>
                      </div>
                    )}
                  </div>
               </div>

               <div className="flex gap-4 pt-5 border-t border-gray-100 dark:border-gray-800 shrink-0 mt-auto">
                 <button 
                    onClick={() => handleCancelBooking(checkoutStall.stallId)} 
                    className="w-1/2 py-3.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl transition-all"
                 >
                   ยกเลิกรายการ
                 </button>
                 <button 
                    onClick={handleSubmitSlip} 
                    disabled={!slipPreview || isUploading}
                    className="w-1/2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:text-gray-950 dark:hover:bg-emerald-400 font-extrabold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 dark:shadow-none"
                 >
                   {isUploading ? "กำลังตรวจสอบ..." : "ยืนยันการชำระเงิน"}
                 </button>
               </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );

  function StallViewOnly({ stall }: { stall: Stall }) {
    const currentStatus = stall[viewDay]; 
    const isAvailable = currentStatus === "available";
    return (
      <div
        onMouseEnter={() => setHoveredStall(stall)}
        onMouseLeave={() => setHoveredStall(null)}
        // ⚡ เพิ่มฟังก์ชัน onClick ตรงนี้!
        onClick={() => {
          if (isAvailable) {
            handleOpenDaySelection(stall.stallId);
          }
        }}
        className={`
          relative w-24 h-24 rounded-2xl flex items-center justify-center font-bold text-2xl transition-all duration-300
          border-b-[6px] border-r-[4px] 
          ${getBlockStyle(currentStatus, stall.zone)}
          ${isAvailable ? "cursor-pointer hover:-translate-y-1.5 hover:-translate-x-1 hover:shadow-lg hover:brightness-105" : "cursor-not-allowed scale-95 saturate-50"}
        `}
      >
        {stall.stallId}
      </div>
    );
  }
}