import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Stall from "@/models/Stall";
import Booking from "@/models/Booking";

// ป้องกันปัญหาการจำ Cache ของ Next.js
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { stallId, userId, days } = body;

    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (!stallId || !userId || !days || days.length === 0) {
      return NextResponse.json({ success: false, message: "ข้อมูลไม่ครบถ้วน กรุณาเลือกวันจอง" }, { status: 400 });
    }

    // 2. ดึงข้อมูลล็อกและเช็กว่ายังว่างอยู่ไหม
    const stall = await Stall.findOne({ stallId });
    if (!stall) {
      return NextResponse.json({ success: false, message: "ไม่พบข้อมูลล็อกพื้นที่นี้" }, { status: 404 });
    }

    // เช็กว่าวันที่ลูกค้าเลือก (เสาร์/อาทิตย์) ยัง available อยู่ไหม
    for (const day of days) {
      if (stall[day] !== "available") {
        const dayTH = day === 'saturday' ? 'วันเสาร์' : 'วันอาทิตย์';
        return NextResponse.json({ success: false, message: `ขออภัย ล็อกนี้ไม่ว่างใน${dayTH}แล้ว` }, { status: 400 });
      }
    }

    // 3. เตรียมข้อมูล
    const expectedPrice = stall.price * days.length;
    const bookingId = `BK${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`; // สุ่มรหัสบิล

    // 4. เปลี่ยนสถานะล็อกในผังตลาดให้เป็น "รอชำระเงิน" (pending) เฉพาะวันที่เลือกจอง
    const stallUpdateFields: any = {};
    days.forEach((day: string) => { stallUpdateFields[day] = "pending"; });
    await Stall.findOneAndUpdate({ stallId }, { $set: stallUpdateFields });

    // 5. สร้างใบจองใหม่ในระบบ
    const newBooking = await Booking.create({
      bookingId,
      stallId,
      userId,
      price: expectedPrice,
      bookingDays: days, // บันทึกว่าจองวันไหนบ้าง
      status: "pending", // รอตรวจสลิป
      ocrPassed: false,
      slipImage: "" // ตอนนี้ยังไม่ได้ส่งสลิป
    });

    return NextResponse.json({ success: true, message: "ล็อกพื้นที่สำเร็จ", data: newBooking });

  } catch (error: any) {
    console.error("Booking API Error:", error);
    // ⚡ ส่ง JSON กลับเสมอ เพื่อป้องกัน Error: Unexpected end of JSON input
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}