import { NextResponse } from 'next/server';
import mongoose from "mongoose";
import connectToDatabase from '@/lib/mongodb';
import Setting from '@/models/Setting';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    let filter: any = {};
    if (type === 'current') {
      const setting = await Setting.findOne({ key: 'system' });
      if (setting && setting.lastResetTime) {
        filter = { createdAt: { $gte: new Date(setting.lastResetTime) } };
      }
    }

    // ⚡ ดึงข้อมูลจาก MongoDB ตรงๆ ไม่ผ่านตัวกรองเก่า
    const db = mongoose.connection.db;
    const bookings = await db?.collection('bookings').find(filter).sort({ createdAt: -1 }).toArray() || [];
    
    // ดึงชื่อลูกค้ามาประกบ
    const userIds = [...new Set(bookings.map(b => b.userId))];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap: Record<string, any> = {};
    users.forEach((u: any) => { userMap[u._id.toString()] = { name: u.name, phone: u.phoneNumber || '-' }; });

    // ประกอบร่างส่งให้หน้าเว็บ
    const formattedBookings = bookings.map((b: any) => {
      const uId = b.userId?.toString();
      return {
        _id: b._id.toString(),
        bookingId: b.bookingId,
        stallId: b.stallId,
        price: b.price,
        bookingDays: b.bookingDays || [], // 👈 ข้อมูลจะมาแน่นอน 100%
        status: b.status,
        ocrPassed: b.ocrPassed,
        slipImage: b.slipImage,
        createdAt: b.createdAt,
        customerName: userMap[uId]?.name || 'ไม่พบชื่อ (ผู้ใช้อาจถูกลบ)',
        customerPhone: userMap[uId]?.phone || '-'
      };
    });
    
    return NextResponse.json({ success: true, data: formattedBookings });
  } catch (error: any) {
    console.error("Admin Bookings API Error:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}