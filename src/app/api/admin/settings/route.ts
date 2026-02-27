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
      setting = await Setting.create({ key: 'system', isOpen: true, lastResetTime: new Date() });
    }
    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    console.error("GET Settings Error:", error);
    return NextResponse.json({ success: false, message: 'เซิร์ฟเวอร์มีปัญหา: ' + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, isOpen, openTime, closeTime } = body;
    
    let setting = await Setting.findOne({ key: 'system' });
    if (!setting) {
      setting = await Setting.create({ key: 'system', isOpen: true, lastResetTime: new Date() });
    }

    // 1. บันทึกเวลา
    if (action === 'update_timer') {
      setting.isOpen = isOpen;
      
      const newOpenTime = openTime ? new Date(openTime) : null;
      
      // ถ้าเปลี่ยนเวลาเปิดใหม่ ให้ล้างค่านับรอบ เพื่อให้มันล้างกระดานอัตโนมัติเมื่อถึงเวลา
      if (newOpenTime && (!setting.openTime || newOpenTime.getTime() !== setting.openTime.getTime())) {
         setting.lastResetTime = new Date(0); 
      }

      setting.openTime = newOpenTime;
      setting.closeTime = closeTime ? new Date(closeTime) : null;
      await setting.save();
      
      return NextResponse.json({ success: true, message: 'บันทึกเวลาเปิด-ปิดระบบสำเร็จ!' });
    }

    // 2. ล้างกระดาน (Manual)
    if (action === 'reset_board') {
      await Stall.updateMany({}, { $set: { saturday: 'available', sunday: 'available' } });
      setting.lastResetTime = new Date();
      await setting.save();
      return NextResponse.json({ success: true, message: 'ล้างกระดานเริ่มต้นรอบใหม่สำเร็จ 100%!' });
    }

    return NextResponse.json({ success: false, message: 'คำสั่งไม่ถูกต้อง' }, { status: 400 });
  } catch (error: any) {
    console.error("POST Settings Error:", error);
    return NextResponse.json({ success: false, message: 'เซิร์ฟเวอร์พัง: ' + error.message }, { status: 500 });
  }
}