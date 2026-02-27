import mongoose, { Schema, models } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true }, // 👈 เพิ่มฟิลด์เบอร์โทรศัพท์
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

export default models.User || mongoose.model('User', userSchema);