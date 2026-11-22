import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 90 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'volunteer', 'shelter', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    shelterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter', default: null },
    emailVerified: { type: Boolean, default: false },
    verifyCodeHash: { type: String, default: null, select: false },
    verifyExpires: { type: Date, default: null, select: false },
    verifyAttempts: { type: Number, default: 0, select: false },
        verifyLastSentAt: { type: Date, default: null, select: false },
  resetTokenHash: { type: String, default: null, select: false },
resetExpires: { type: Date, default: null, select: false },
resetLastSentAt: { type: Date, default: null, select: false },},
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);