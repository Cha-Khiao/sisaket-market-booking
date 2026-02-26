import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    // ดึง userId จาก URL Parameter (เช่น /api/my-bookings?userId=123)
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'ไม่พบรหัสผู้ใช้งาน' }, { status: 400 });
    }

    // ค้นหาประวัติการจองทั้งหมดของ User คนนี้ (เรียงจากใหม่ไปเก่า)
    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'ดึงข้อมูลประวัติล้มเหลว' }, { status: 500 });
  }
}