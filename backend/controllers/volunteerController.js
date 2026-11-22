import { AnimalReport } from '../models/AnimalReport.js';
import { Volunteer } from '../models/Volunteer.js';
import { HttpError, asyncHandler } from '../http.js';

const priorityRank = { Emergency: 0, Urgent: 1, Normal: 2 };

export const requestQueue = asyncHandler(async (_req, res) => {
  const reports = await AnimalReport.find({
    verified: true,
    status: { $in: ['Pending', 'Accepted', 'In Progress'] },
  })
    .populate('reporterId', 'name')
    .populate('assignedVolunteerId', 'name')
    .lean();
  reports.sort(
    (a, b) =>
      priorityRank[a.priority] - priorityRank[b.priority] || new Date(a.date) - new Date(b.date)
  );
  res.json({ reports });
});

export const volunteerSummary = asyncHandler(async (req, res) => {
  let profile = await Volunteer.findOne({ userId: req.user._id });
  if (!profile && req.user.role === 'volunteer') {
    profile = await Volunteer.create({
      userId: req.user._id,
      name: req.user.name,
      contact: req.user.phone,
      area: 'Set your service area',
      availability: 'available',
    });
  }
  const assignments = await AnimalReport.find({ assignedVolunteerId: req.user._id })
    .sort({ date: -1 })
    .populate('reporterId', 'name phone email');
  res.json({ profile, assignments });
});

export const updateAvailability = asyncHandler(async (req, res) => {
  if (!['available', 'busy', 'off-duty'].includes(req.body.availability))
    throw new HttpError(400, 'Choose available, busy, or off-duty.');
  const profile = await Volunteer.findOneAndUpdate(
    { userId: req.user._id },
    {
      $set: {
        availability: req.body.availability,
        name: req.body.name || req.user.name,
        contact: req.body.contact || req.user.phone,
        area: req.body.area || 'Set your service area',
      },
      $setOnInsert: { userId: req.user._id },
    },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ profile });
});
