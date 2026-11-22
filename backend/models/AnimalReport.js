import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    address: { type: String, trim: true, default: 'Location selected on map' },
  },
  { _id: false }
);

const animalReportSchema = new mongoose.Schema(
  {
    animalType: { type: String, required: true, trim: true, maxlength: 50 },
    description: { type: String, required: true, trim: true, maxlength: 1800 },
    photo: { type: String, default: '' },
    imageStatus: { type: String, enum: ['approved', 'pending_review'], default: 'approved' },
suggestedSpecies: { type: String },
confidence: { type: Number },
imageHash: { type: String, index: true },
    location: { type: locationSchema, required: true },
    date: { type: Date, default: Date.now },
    assistanceRequired: { type: String, required: true, trim: true, maxlength: 500 },
    priority: { type: String, enum: ['Emergency', 'Urgent', 'Normal'], default: 'Normal' },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'In Progress', 'Resolved'],
      default: 'Pending',
    },
    verified: { type: Boolean, default: false },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedVolunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

animalReportSchema.index({ verified: 1, status: 1, priority: 1, date: -1 });
export const AnimalReport = mongoose.model('AnimalReport', animalReportSchema);
