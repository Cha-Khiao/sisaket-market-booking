import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Stall from "@/models/Stall";

export async function GET() {
  try {
    await connectToDatabase();
    
    // 1. ล้างข้อมูลล็อกเก่าทิ้งทั้งหมดเพื่อป้องกันบั๊ก
    await Stall.deleteMany({});

    // 2. ข้อมูลล็อกชุดใหม่ ที่มี saturday และ sunday
    const newStalls = [
      { stallId: "F01", zone: "โซนอาหาร", price: 150, saturday: "available", sunday: "available" },
      { stallId: "F02", zone: "โซนอาหาร", price: 150, saturday: "available", sunday: "available" },
      { stallId: "F03", zone: "โซนอาหาร", price: 150, saturday: "available", sunday: "available" },
      { stallId: "F04", zone: "โซนอาหาร", price: 150, saturday: "available", sunday: "available" },
      { stallId: "C01", zone: "โซนเสื้อผ้า", price: 120, saturday: "available", sunday: "available" },
      { stallId: "C02", zone: "โซนเสื้อผ้า", price: 120, saturday: "available", sunday: "available" },
      { stallId: "C03", zone: "โซนเสื้อผ้า", price: 120, saturday: "available", sunday: "available" },
      { stallId: "C04", zone: "โซนเสื้อผ้า", price: 120, saturday: "available", sunday: "available" },
    ];

    // 3. บันทึกลงฐานข้อมูล
    await Stall.insertMany(newStalls);

    return NextResponse.json({ 
      success: true, 
      message: "🎉 สร้างพื้นที่ตลาดชุดใหม่ (รองรับเสาร์-อาทิตย์) สำเร็จแล้ว! กลับไปดูหน้าแผนที่ได้เลย" 
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดในการสร้างข้อมูล" }, { status: 500 });
  }
}