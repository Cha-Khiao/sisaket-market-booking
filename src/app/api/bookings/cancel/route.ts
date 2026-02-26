import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Stall from '@/models/Stall';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // รับรหัสล็อก และ วันที่ต้องการปลดล็อก (เช่น ["saturday", "sunday"])
    const { stallId, days } = await req.json();

    if (!stallId || !days || days.length === 0) {
      return NextResponse.json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    // สร้างคำสั่งเปลี่ยนสถานะเฉพาะวันที่เลือก ให้กลับเป็น 'available' (ว่าง)
    let updateFields: any = {};
    days.forEach((day: string) => {
      updateFields[day] = 'available';
    });

    await Stall.findOneAndUpdate(
      { stallId },
      { $set: updateFields }
    );

    return NextResponse.json({ success: true, message: 'คืนพื้นที่สำเร็จ' });

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}