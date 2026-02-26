import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Stall from '@/models/Stall';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, stallId, zone, price, id } = body;

    // 1. เพิ่มล็อกใหม่
    if (action === 'create') {
      const existing = await Stall.findOne({ stallId });
      if (existing) {
        return NextResponse.json({ success: false, message: 'รหัสล็อกนี้มีในระบบแล้ว กรุณาใช้รหัสอื่น' }, { status: 400 });
      }
      await Stall.create({ 
        stallId, 
        zone, 
        price, 
        saturday: 'available', 
        sunday: 'available' 
      });
      return NextResponse.json({ success: true, message: 'เพิ่มล็อกพื้นที่สำเร็จ!' });
    } 
    
    // 2. แก้ไขข้อมูลล็อก
    else if (action === 'update') {
      const existing = await Stall.findOne({ stallId, _id: { $ne: id } });
      if (existing) return NextResponse.json({ success: false, message: 'รหัสล็อกนี้ซ้ำกับล็อกอื่น' }, { status: 400 });

      await Stall.findByIdAndUpdate(id, { stallId, zone, price });
      return NextResponse.json({ success: true, message: 'อัปเดตข้อมูลสำเร็จ!' });
    } 
    
    // 3. ลบล็อกทิ้ง
    else if (action === 'delete') {
      await Stall.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: 'ลบพื้นที่สำเร็จ!' });
    }

    return NextResponse.json({ success: false, message: 'คำสั่งไม่ถูกต้อง' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' }, { status: 500 });
  }
}