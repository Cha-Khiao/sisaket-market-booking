import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Stall from '@/models/Stall';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // รับค่า days ที่หน้าเว็บส่งมาด้วย
    const { stallId, userId, price, slipImage, ocrPassed, days } = await req.json();

    // 1. หาใบจองสถานะ pending ที่เพิ่งถูกสร้างตอนแรกล่าสุด
    let booking = await Booking.findOne({ stallId, userId, status: "pending" }).sort({ createdAt: -1 });

    if (!booking) {
      // ⚡ ถ้าไม่มีใบจองเดิม ให้สร้างใหม่และ "ต้องบันทึก bookingDays ด้วย"
      const bookingId = `BK${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
      booking = new Booking({
        bookingId,
        stallId,
        userId,
        price,
        bookingDays: days || [], // 👈 บันทึกวันเสาร์/อาทิตย์ลงฐานข้อมูล
        status: ocrPassed ? "approved" : "pending",
        slipImage,
        ocrPassed
      });
    } else {
      // ⚡ ถ้ามีใบจองอยู่แล้ว ให้อัปเดตสลิปและ "อัปเดตวันจองทับลงไปเพื่อความชัวร์"
      booking.slipImage = slipImage;
      booking.ocrPassed = ocrPassed;
      if (days && days.length > 0) {
        booking.bookingDays = days; // 👈 อัปเดตวันเสาร์/อาทิตย์ลงฐานข้อมูล
      }
      if (ocrPassed) {
        booking.status = "approved";
      }
    }

    await booking.save();

    // 2. ถ้า AI ตรวจสลิปผ่าน (OCR Passed) ให้อนุมัติล็อกพื้นที่ในแผนที่เลย
    if (ocrPassed && days && days.length > 0) {
      const stallUpdateFields: any = {};
      days.forEach((day: string) => { stallUpdateFields[day] = "booked"; });
      await Stall.findOneAndUpdate({ stallId }, { $set: stallUpdateFields });
    }

    return NextResponse.json({ success: true, message: "อัปเดตสลิปสำเร็จ" });

  } catch (error: any) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดในการส่งสลิป" }, { status: 500 });
  }
}