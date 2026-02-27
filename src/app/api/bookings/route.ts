import { NextResponse } from "next/server";
import mongoose from "mongoose"; // ⚡ เรียกใช้ mongoose โดยตรง
import connectToDatabase from "@/lib/mongodb";
import Stall from "@/models/Stall";

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

    // ⚡ ทะลวงกำแพง: ใช้ Native MongoDB บันทึกข้อมูลลงตารางตรงๆ 
    const db = mongoose.connection.db;
    await db?.collection('bookings').insertOne({
      bookingId,
      stallId,
      userId,
      price: expectedPrice,
      bookingDays: days, // 👈 ยัดข้อมูลรอบวันลงไปตรงๆ แบบนี้เซฟติดแน่นอน!
      status: "pending",
      ocrPassed: false,
      slipImage: "",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true, message: "ล็อกพื้นที่สำเร็จ" });

  } catch (error: any) {
    console.error("Booking API Error:", error);
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}