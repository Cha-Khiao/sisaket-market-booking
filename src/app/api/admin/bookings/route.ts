import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Setting from '@/models/Setting';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    // ดึงค่า URL Parameter ว่าเป็น '?type=current' หรือไม่
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    let filter: any = {};
    
    // ⚡ ถ้าระบุว่าเอาเฉพาะ "รอบปัจจุบัน"
    if (type === 'current') {
      const setting = await Setting.findOne({ key: 'system' });
      // ให้หาบิลที่ถูกสร้างขึ้น "หลังจาก" เวลาที่กดปุ่มล้างกระดานล่าสุด
      if (setting && setting.lastResetTime) {
        filter = { createdAt: { $gte: new Date(setting.lastResetTime) } };
      }
    }

    // ดึงข้อมูลตาม Filter ที่ตั้งไว้ (ถ้า type=current จะได้แค่ของรอบนี้, ถ้าไม่มี type จะได้ทั้งหมด)
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: bookings });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}