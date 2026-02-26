import mongoose, { Schema, models } from 'mongoose';

const stallSchema = new Schema({
  stallId: { type: String, required: true, unique: true },
  zone: { type: String, required: true },
  price: { type: Number, required: true },
  // ⚡ 2 บรรทัดนี้สำคัญมาก! ถ้าไม่มี ฐานข้อมูลจะไม่ยอมบันทึก
  saturday: { type: String, enum: ['available', 'pending', 'booked'], default: 'available' },
  sunday: { type: String, enum: ['available', 'pending', 'booked'], default: 'available' },
}, { timestamps: true });

export default models.Stall || mongoose.model('Stall', stallSchema);