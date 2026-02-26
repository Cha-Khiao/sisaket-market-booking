import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Stall from "@/models/Stall";
import Booking from "@/models/Booking";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // เปลี่ยนมารับ bookingId เพื่อให้รู้ว่าลูกค้าจองวันไหนบ้าง
    const { bookingId, stallId, action } = await req.json();

    const booking = await Booking.findOne({ bookingId });
    if (!booking) return NextResponse.json({ success: false, message: "ไม่พบข้อมูลใบเสร็จ" }, { status: 404 });

    let stallUpdateFields: any = {};

    if (action === "approve") {
      booking.status = "approved";
      // เปลี่ยนเฉพาะวันที่ลูกค้าจองให้เป็น booked
      booking.bookingDays.forEach((day: string) => { stallUpdateFields[day] = "booked"; });
    } else if (action === "reset") {
      booking.status = "rejected";
      // คืนสถานะเฉพาะวันที่ลูกค้าจองให้กลับเป็น available
      booking.bookingDays.forEach((day: string) => { stallUpdateFields[day] = "available"; });
    }

    await booking.save();
    
    if (Object.keys(stallUpdateFields).length > 0) {
      await Stall.findOneAndUpdate({ stallId }, { $set: stallUpdateFields });
    }

    return NextResponse.json({ 
      success: true, 
      message: action === "approve" ? "อนุมัติสลิปและล็อกพื้นที่ถาวรแล้ว" : "ยกเลิกสลิปและคืนพื้นที่สำเร็จ" 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดในระบบแอดมิน" }, { status: 500 });
  }
}