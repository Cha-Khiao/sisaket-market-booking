"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DashboardData {
  totalStalls: number;
  totalRevenue: number;
  pendingSlips: number;
  availableSlots: number;
  bookedSlots: number;
  revenueByZone: any[];
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  
  // ⚡ State สำหรับนาฬิกา
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // ให้เริ่มทำงานหลังจาก Component โหลดเสร็จ เพื่อป้องกัน Hydration Error
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const stallsRes = await fetch("/api/stalls");
        const stallsResult = await stallsRes.json();
        
        // ⚡ ดึงสลิปเฉพาะรอบปัจจุบัน
        const bookingsRes = await fetch("/api/admin/bookings?type=current");
        const bookingsResult = await bookingsRes.json();

        if (stallsResult.success && bookingsResult.success) {
          const stalls = stallsResult.data;
          const bookings = bookingsResult.data;

          let booked = 0; let available = 0;
          stalls.forEach((s: any) => {
            ['saturday', 'sunday'].forEach(day => {
              if (s[day] === 'booked') booked++;
              else if (s[day] === 'available') available++;
            });
          });

          const zoneRevenue: Record<string, number> = { "โซนอาหาร": 0, "โซนเสื้อผ้า": 0, "โซนทั่วไป": 0 };
          let totalRev = 0;

          bookings.filter((b: any) => b.status === 'approved').forEach((b: any) => {
             totalRev += b.price;
             const stall = stalls.find((s:any) => s.stallId === b.stallId);
             if (stall) {
               if (zoneRevenue[stall.zone] !== undefined) zoneRevenue[stall.zone] += b.price;
               else zoneRevenue[stall.zone] = b.price;
             }
          });

          const chartData = Object.keys(zoneRevenue).map(key => ({
            name: key.replace('โซน', ''),
            ยอดเงิน: zoneRevenue[key]
          }));

          const pending = bookings.filter((b: any) => b.status === 'pending').length;

          setData({
            totalStalls: stalls.length * 2,
            totalRevenue: totalRev,
            pendingSlips: pending,
            availableSlots: available,
            bookedSlots: booked,
            revenueByZone: chartData
          });
        }
      } catch (error) {
        toast.error("โหลดข้อมูล Dashboard ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading || !data) return <div className="min-h-screen flex items-center justify-center font-bold dark:text-white animate-pulse">กำลังประมวลผลข้อมูลกราฟ...</div>;

  const pieData = [
    { name: 'ขายแล้ว', value: data.bookedSlots, color: '#10b981' }, 
    { name: 'ว่าง', value: data.availableSlots, color: '#3b82f6' }, 
    { name: 'รอตรวจสอบ', value: data.totalStalls - data.bookedSlots - data.availableSlots, color: '#f59e0b' } 
  ];

  return (
    <div className="max-w-7xl mx-auto pb-10 animate-in fade-in duration-500">
      
      {/* ⚡ Header ด้านบนที่มีนาฬิกา */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight">ภาพรวมระบบ (Dashboard)</h1>
          <p className="text-gray-500 mt-2 font-medium text-lg">สรุปสถานะพื้นที่และรายได้ของรอบการจองปัจจุบัน</p>
        </div>
        
        {/* ⚡ นาฬิกาแบบ Real-time */}
        {currentTime && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-6 py-3 rounded-2xl shadow-sm text-right shrink-0">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">
              {currentTime.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-2xl font-mono font-black text-blue-600 dark:text-blue-500">
              เวลา {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
            </p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="รายได้รอบปัจจุบัน" value={`฿${data.totalRevenue.toLocaleString()}`} icon="💰" color="bg-orange-500" />
        <StatCard title="พื้นที่รอตรวจสอบ" value={data.pendingSlips} suffix="รายการ" icon="⏳" color="bg-yellow-500" />
        <StatCard title="พื้นที่อนุมัติแล้ว" value={data.bookedSlots} suffix="ล็อก" icon="✅" color="bg-emerald-500" />
        <StatCard title="พื้นที่ว่างเหลือ" value={data.availableSlots} suffix="ล็อก" icon="🛒" color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold mb-6 dark:text-white">📈 รายได้แยกตามโซน</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByZone} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value}`} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="ยอดเงิน" fill="#f97316" radius={[6, 6, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center">
          <h3 className="text-lg font-bold mb-2 dark:text-white self-start w-full">🎯 สัดส่วนการจอง</h3>
          <div className="h-56 w-full relative flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-3xl font-black text-gray-800 dark:text-white">{data.totalStalls}</span>
               <span className="text-xs text-gray-500 font-bold">ล็อกทั้งหมด</span>
            </div>
          </div>
          
          <div className="flex gap-4 mt-4 text-xs font-bold text-gray-600 dark:text-gray-400">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );

  function StatCard({ title, value, suffix, icon, color }: { title: string, value: string|number, suffix?: string, icon: string, color: string }) {
    return (
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
        <div className="flex justify-between items-start mb-4">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${color} bg-opacity-20 text-white shadow-sm`}>
             {icon}
           </div>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-1">{title}</p>
          <p className="text-3xl font-black text-gray-800 dark:text-white">
            {value} {suffix && <span className="text-sm font-bold text-gray-400 ml-1">{suffix}</span>}
          </p>
        </div>
      </div>
    );
  }
}