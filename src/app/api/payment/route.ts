import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Stall from '@/models/Stall';
import Booking from '@/models/Booking';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const { stallId, userId, price, slipImage, ocrPassed, days } = await req.json();

    const bookingId = `BK-${Date.now().toString().slice(-6)}`;
    
    // ⚡ ใบเสร็จ: ถ้า OCR ผ่านให้อนุมัติเลย ถ้าไม่ผ่านให้ "รอตรวจสอบ"
    const bookingStatus = ocrPassed ? 'approved' : 'pending';
    
    // ⚡ สถานะล็อก: เมื่อส่งสลิปแล้ว ต้องเปลี่ยนเป็น "จองแล้ว (booked)" เสมอ เพื่อป้องกันระบบ 15 นาทีเตะออก
    const stallFinalStatus = 'booked'; 

    await Booking.create({
      bookingId,
      stallId,
      userId,
      price,
      bookingDays: days, 
      slipImage,
      ocrPassed,
      status: bookingStatus
    });

    let updateFields: any = {};
    days.forEach((day: string) => {
      updateFields[day] = stallFinalStatus;
    });

    await Stall.findOneAndUpdate(
      { stallId },
      { $set: updateFields }
    );

    return NextResponse.json({ 
      success: true, 
      message: ocrPassed ? 'ชำระเงินสำเร็จ ระบบอนุมัติอัตโนมัติ' : 'ส่งหลักฐานสำเร็จ กรุณารอเจ้าหน้าที่ตรวจสอบ' 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }, { status: 500 });
  }
}