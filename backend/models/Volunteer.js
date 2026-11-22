import mongoose from 'mongoose';

const volunteerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true, trim: true },
  contact: { type: String, required: true, trim: true },
  area: { type: String, required: true, trim: true },
  availability: { type: String, enum: ['available', 'busy', 'off-duty'], default: 'available' }
}, { timestamps: true });

export const Volunteer = mongoose.model('Volunteer', volunteerSchema);
