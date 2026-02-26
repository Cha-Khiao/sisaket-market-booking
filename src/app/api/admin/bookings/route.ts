import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Setting from '@/models/Setting';
import User from '@/models/User'; // ⚡ เพิ่มการดึงโมเดล User

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

    // 1. ดึงข้อมูลการจองทั้งหมด
    const bookings = await Booking.find(filter).sort({ createdAt: -1 }).lean();
    
    // 2. ดึงข้อมูลชื่อและเบอร์ของลูกค้าจากตาราง User
    const userIds = [...new Set(bookings.map(b => b.userId))];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    
    // 3. สร้าง Map เพื่อประกบข้อมูลให้หากันเจอง่ายๆ
    const userMap: Record<string, any> = {};
    users.forEach((u: any) => {
      userMap[u._id.toString()] = { name: u.name, phone: u.phoneNumber || '-' };
    });

    // 4. เอาชื่อและเบอร์ใส่เข้าไปในใบเสร็จ
    const formattedBookings = bookings.map((b: any) => {
      const uId = b.userId?.toString();
      return {
        ...b,
        customerName: userMap[uId]?.name || 'ไม่พบชื่อ (ผู้ใช้อาจถูกลบ)',
        customerPhone: userMap[uId]?.phone || '-'
      };
    });
    
    return NextResponse.json({ success: true, data: formattedBookings });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}