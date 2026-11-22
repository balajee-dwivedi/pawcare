import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    address: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const lostFoundSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['lost', 'found'], required: true },
    animalType: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 1600 },
    photo: { type: String, default: '' },
    imageStatus: { type: String, enum: ['approved', 'pending_review'], default: 'approved' },
    suggestedSpecies: { type: String },
    confidence: { type: Number },
    imageHash: { type: String, index: true },
    location: { type: locationSchema, default: undefined },
    contact: { type: String, required: true, trim: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Open', 'Reunited', 'Closed'], default: 'Open' },
  },
  { timestamps: true }
);

export const LostFound = mongoose.model('LostFound', lostFoundSchema);
