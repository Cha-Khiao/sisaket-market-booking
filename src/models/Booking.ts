import mongoose, { Schema, models } from 'mongoose';

const bookingSchema = new Schema({
  bookingId: { type: String, required: true, unique: true },
  stallId: { type: String, required: true },
  userId: { type: String, required: true },
  price: { type: Number, required: true },
  slipImage: { type: String }, // เก็บรูปสลิปเป็น Base64 String
  ocrPassed: { type: Boolean, default: false }, // OCR ตรวจผ่านไหม
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default models.Booking || mongoose.model('Booking', bookingSchema);