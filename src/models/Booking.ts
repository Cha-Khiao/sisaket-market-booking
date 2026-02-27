import mongoose, { Schema, models } from 'mongoose';

const bookingSchema = new Schema({
  bookingId: { type: String, required: true },
  stallId: { type: String, required: true },
  userId: { type: String, required: true },
  price: { type: Number, required: true },
  bookingDays: { type: [String], default: [] }, 
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  slipImage: { type: String, default: '' },
  ocrPassed: { type: Boolean, default: false }
}, { timestamps: true, strict: false }); // ⚡ จุดสำคัญ: strict: false บังคับให้รับข้อมูลใหม่เสมอ

export default models.Booking || mongoose.model('Booking', bookingSchema);