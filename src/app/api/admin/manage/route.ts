import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Stall from "@/models/Stall";
import Booking from "@/models/Booking";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const { bookingId, stallId, action } = await req.json();

    const booking = await Booking.findOne({ bookingId });
    if (!booking) return NextResponse.json({ success: false, message: "ไม่พบข้อมูลใบเสร็จ" }, { status: 404 });

    let stallUpdateFields: any = {};

    // ⚡ จุดสำคัญ: ดัก Error กรณีเป็น "บิลเก่า" ที่ไม่มีตัวแปร bookingDays ให้มองเป็น Array ว่างๆ แทน
    const daysToUpdate = booking.bookingDays || [];

    if (action === "approve") {
      booking.status = "approved";
      // วนลูปเปลี่ยนสถานะล็อกให้เป็น booked เฉพาะวันที่จอง
      daysToUpdate.forEach((day: string) => { stallUpdateFields[day] = "booked"; });
    } else if (action === "reset") {
      booking.status = "rejected";
      // วนลูปคืนพื้นที่ให้กลับเป็น available
      daysToUpdate.forEach((day: string) => { stallUpdateFields[day] = "available"; });
    }

    await booking.save();
    
    // ถ้ามีการเปลี่ยนแปลงสถานะล็อกพื้นที่ ให้อัปเดตตาราง Stall ด้วย
    if (Object.keys(stallUpdateFields).length > 0) {
      await Stall.findOneAndUpdate({ stallId }, { $set: stallUpdateFields });
    }

    return NextResponse.json({ 
      success: true, 
      message: action === "approve" ? "อนุมัติสลิปและล็อกพื้นที่ถาวรแล้ว" : "ยกเลิกสลิปและคืนพื้นที่สำเร็จ" 
    });

  } catch (error: any) {
    // ⚡ ให้แสดง Error จริงใน Terminal เวลาระบบพัง จะได้รู้สาเหตุ
    console.error("Manage API Error:", error); 
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}