import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Setting from '@/models/Setting';
import Stall from '@/models/Stall';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    let setting = await Setting.findOne({ key: 'system' });
    if (!setting) {
      setting = await Setting.create({ key: 'system', isOpen: true, lastResetTime: new Date(0) });
    }
    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error: ' + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { action, isOpen, openTime, closeTime } = await req.json();
    
    let setting = await Setting.findOne({ key: 'system' });
    if (!setting) setting = await Setting.create({ key: 'system' });

    // 1. อัปเดตเวลาเปิด-ปิด
    if (action === 'update_timer') {
      setting.isOpen = isOpen;
      
      const newOpenTime = openTime ? new Date(openTime) : null;
      
      // ⚡ LOGIC สำคัญ: ถ้าแอดมินเปลี่ยน "เวลาเปิดระบบใหม่" ให้ล้างความจำการรีเซ็ต
      // เพื่อให้ระบบรู้ว่า "ต้องล้างกระดานนะเมื่อถึงเวลานี้"
      if (newOpenTime && (!setting.openTime || newOpenTime.getTime() !== setting.openTime.getTime())) {
         setting.lastResetTime = new Date(0); // ย้อนเวลาไปปี 1970 เพื่อบังคับให้ล้างกระดานเมื่อถึงเวลา
      }

      setting.openTime = newOpenTime;
      setting.closeTime = closeTime ? new Date(closeTime) : null;
      await setting.save();
      
      return NextResponse.json({ success: true, message: 'บันทึกเวลาสำเร็จ ระบบจะล้างกระดานอัตโนมัติเมื่อถึงเวลาเปิด' });
    }

    // 2. ล้างกระดาน (ปุ่มฉุกเฉิน Manual)
    if (action === 'reset_board') {
      await Stall.updateMany({}, { $set: { saturday: 'available', sunday: 'available' } });
      setting.lastResetTime = new Date();
      await setting.save();
      return NextResponse.json({ success: true, message: 'ล้างกระดานเริ่มต้นรอบใหม่สำเร็จ!' });
    }

    return NextResponse.json({ success: false, message: 'คำสั่งไม่ถูกต้อง' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error: ' + error.message }, { status: 500 });
  }
}