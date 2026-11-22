import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    address: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const shelterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    location: { type: locationSchema, default: undefined },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 1200 },
  },
  { timestamps: true }
);

export const Shelter = mongoose.model('Shelter', shelterSchema);
