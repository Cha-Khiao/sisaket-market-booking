import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Stall from "@/models/Stall";
import Booking from "@/models/Booking";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { stallId, userId, days } = body;

    if (!stallId || !userId || !days || days.length === 0) {
      return NextResponse.json({ success: false, message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const stall = await Stall.findOne({ stallId });
    if (!stall) return NextResponse.json({ success: false, message: "ไม่พบข้อมูลล็อก" }, { status: 404 });

    const expectedPrice = stall.price * days.length;
    const bookingId = `BK${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;

    const stallUpdateFields: any = {};
    days.forEach((day: string) => { stallUpdateFields[day] = "pending"; });
    await Stall.findOneAndUpdate({ stallId }, { $set: stallUpdateFields });

    const newBooking = await Booking.create({
      bookingId,
      stallId,
      userId,
      price: expectedPrice,
      bookingDays: days,
      status: "pending",
      ocrPassed: false,
      slipImage: ""
    });

    // ⚡ บังคับยัดข้อมูลลงตารางโดยตรงด้วย Native MongoDB ทับอีก 1 รอบ! (กันพลาด 100%)
    await Booking.collection.updateOne(
      { _id: newBooking._id },
      { $set: { bookingDays: days } }
    );

    return NextResponse.json({ success: true, message: "ล็อกพื้นที่สำเร็จ", data: newBooking });

  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}