import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Setting from '@/models/Setting';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // รับค่าว่าเป็น current หรือ all

    let filter = {};
    // ⚡ ถ้าขอข้อมูลรอบปัจจุบัน ให้ดึงเฉพาะบิลที่เกิด "หลังจากการรีเซ็ตครั้งล่าสุด"
    if (type === 'current') {
      const setting = await Setting.findOne({ key: 'system' });
      if (setting && setting.lastResetTime) {
        filter = { createdAt: { $gte: setting.lastResetTime } };
      }
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}