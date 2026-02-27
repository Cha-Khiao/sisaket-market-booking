import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Stall from '@/models/Stall';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const { stallId, userId, price, slipImage, ocrPassed, days } = await req.json();

    let booking = await Booking.findOne({ stallId, userId, status: "pending" }).sort({ createdAt: -1 });

    if (booking) {
      // ⚡ อัปเดตข้อมูลด้วย Native MongoDB โดยตรง ข้ามระบบกรองของ Mongoose
      await Booking.collection.updateOne(
        { _id: booking._id },
        { 
          $set: { 
            slipImage: slipImage, 
            ocrPassed: ocrPassed,
            status: ocrPassed ? "approved" : "pending",
            bookingDays: days && days.length > 0 ? days : booking.bookingDays
          } 
        }
      );

      if (ocrPassed && days && days.length > 0) {
        const stallUpdateFields: any = {};
        days.forEach((day: string) => { stallUpdateFields[day] = "booked"; });
        await Stall.findOneAndUpdate({ stallId }, { $set: stallUpdateFields });
      }

      return NextResponse.json({ success: true, message: "อัปเดตสลิปสำเร็จ" });
    } else {
      return NextResponse.json({ success: false, message: "ไม่พบใบจอง" }, { status: 404 });
    }

  } catch (error: any) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}