import mongoose, { Schema, models } from 'mongoose';

const settingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  isOpen: { type: Boolean, default: true },
  openTime: { type: Date, default: null },
  closeTime: { type: Date, default: null },
  lastResetTime: { type: Date, default: Date.now }
});

export default models.Setting || mongoose.model('Setting', settingSchema);