import mongoose from 'mongoose';

const adoptionSchema = new mongoose.Schema({
  animalType: { type: String, required: true, trim: true },
  age: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['Female', 'Male', 'Unknown'], default: 'Unknown' },
  description: { type: String, required: true, trim: true, maxlength: 1400 },
  photo: { type: String, default: '' },
  imageStatus: { type: String, enum: ['approved', 'pending_review'], default: 'approved' },
  suggestedSpecies: { type: String },
  confidence: { type: Number },
  imageHash: { type: String, index: true },
  shelterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter', required: true },
  adoptionStatus: { type: String, enum: ['Available', 'Adopted'], default: 'Available' }
}, { timestamps: true });

export const Adoption = mongoose.model('Adoption', adoptionSchema);
  