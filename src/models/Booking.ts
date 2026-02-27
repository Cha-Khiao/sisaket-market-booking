import mongoose, { Schema, models } from 'mongoose';

const bookingSchema = new Schema({
  bookingId: { type: String, required: true },
  stallId: { type: String, required: true },
  userId: { type: String, required: true },
  price: { type: Number, required: true },
  
  // ⚡ เพิ่มบรรทัดนี้ เพื่อให้ฐานข้อมูลยอมรับข้อมูลวันเสาร์-อาทิตย์
  bookingDays: { type: [String], default: [] }, 
  
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  slipImage: { type: String, default: '' },
  ocrPassed: { type: Boolean, default: false }
}, { timestamps: true });

export default models.Booking || mongoose.model('Booking', bookingSchema);