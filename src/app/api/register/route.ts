import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, phoneNumber, password } = await req.json();

    // เช็กว่าส่งมาครบ 4 อย่างไหม
    if (!name || !email || !phoneNumber || !password) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ⚡ จุดสำคัญ: บันทึกเบอร์โทรศัพท์ลงฐานข้อมูล
    const newUser = await User.create({
      name,
      email,
      phoneNumber, // ต้องมีบรรทัดนี้ ไม่งั้นไม่ลง Database
      password: hashedPassword,
      role: "user",
    });

    return NextResponse.json({ message: "สมัครสมาชิกสำเร็จ!", success: true }, { status: 201 });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" }, { status: 500 });
  }
}