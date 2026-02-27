import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Stall from '@/models/Stall';
import Setting from '@/models/Setting';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    
    // 1. คืนสถานะล็อกที่จองค้างไว้เกิน 15 นาที
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    await Stall.updateMany(
      { updatedAt: { $lt: fifteenMinutesAgo }, $or: [{ saturday: 'pending' }, { sunday: 'pending' }] },
      { $set: { saturday: 'available', sunday: 'available' } }
    );

    // 2. ดึงการตั้งค่าระบบเปิด/ปิด
    let setting = await Setting.findOne({ key: 'system' });
    let isOpen = setting ? setting.isOpen : true;
    let openTime = setting?.openTime || null;
    const now = new Date();
    
    if (setting && setting.openTime && setting.closeTime) {
       // ปิดระบบถ้าอยู่นอกเวลา
       if (now < new Date(setting.openTime) || now > new Date(setting.closeTime)) {
         isOpen = false;
       }
       
       // ⚡ LGOIC: ล้างกระดานอัตโนมัติ (Auto-Reset) เมื่อถึงเวลาเปิดรอบใหม่
       // เช็คว่าเวลาปัจจุบัน >= เวลาเปิด และ เรายังไม่ได้รีเซ็ตในรอบนี้ใช่หรือไม่
       if (now >= new Date(setting.openTime)) {
         if (!setting.lastResetTime || new Date(setting.lastResetTime) < new Date(setting.openTime)) {
            // ทำการล้างกระดานให้กลับเป็น available ทั้งหมด
            await Stall.updateMany({}, { $set: { saturday: 'available', sunday: 'available' } });
            
            // อัปเดตเวลาเคลียร์รอบล่าสุด
            setting.lastResetTime = new Date();
            await setting.save();
            console.log("Auto-Reset Completed for new cycle");
         }
       }
    }

    const stalls = await Stall.find().sort({ stallId: 1 });
    return NextResponse.json({ success: true, data: stalls, system: { isOpen, openTime } });

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}