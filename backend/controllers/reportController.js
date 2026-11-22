import { AnimalReport } from '../models/AnimalReport.js';
import { HttpError, asyncHandler } from '../http.js';

const priorityOrder = { Emergency: 3, Urgent: 2, Normal: 1 };
const rescueOrder = (a, b) =>
  priorityOrder[b.priority] - priorityOrder[a.priority] || new Date(a.date) - new Date(b.date);
const parseLocation = (value) => {
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    throw new HttpError(400, 'Map location is invalid. Please select the location again.');
  }
};

export const listReports = asyncHandler(async (req, res) => {
  const query = req.user?.role === 'admin' ? {} : { verified: true };
  if (req.query.status) query.status = req.query.status;
  if (req.query.priority) query.priority = req.query.priority;
  const reports = await AnimalReport.find(query)
    .sort({ priority: -1, date: 1 })
    .populate('reporterId', 'name')
    .populate('assignedVolunteerId', 'name');
  // Explicit domain ranking avoids relying on alphabetic enum order in MongoDB.
  reports.sort(rescueOrder);
  const isAssignedVolunteer = req.user?.role === 'volunteer';
  res.json({
    reports: reports.map((report) => {
      const item = report.toObject();
      const maySeeContact =
        req.user?.role === 'admin' ||
        (isAssignedVolunteer && String(report.assignedVolunteerId?._id) === String(req.user._id));
      if (maySeeContact) item.reporterId = { ...item.reporterId?.toObject?.(), phone: undefined };
      return item;
    }),
  });
});

export const getMyReports = asyncHandler(async (req, res) => {
  const reports = await AnimalReport.find({ reporterId: req.user._id }).sort({ date: -1 });
  res.json({ reports });
});

export const createReport = asyncHandler(async (req, res) => {
  const { animalType, description, assistanceRequired, priority = 'Normal' } = req.body;
  if (!animalType?.trim() || !description?.trim() || !assistanceRequired?.trim()) {
    throw new HttpError(400, 'Animal type, description, and assistance needed are required.');
  }
  if (!['Emergency', 'Urgent', 'Normal'].includes(priority))
    throw new HttpError(400, 'Choose Emergency, Urgent, or Normal priority.');
  const location = parseLocation(req.body.location);
  if (
    location?.lat == null ||
    location?.lng == null ||
    !Number.isFinite(Number(location.lat)) ||
    Number(location.lat) < -90 ||
    Number(location.lat) > 90 ||
    !Number.isFinite(Number(location.lng)) ||
    Number(location.lng) < -180 ||
    Number(location.lng) > 180
  ) {
    throw new HttpError(400, 'Please select a valid location on the map.');
  }
  const report = await AnimalReport.create({
    animalType: animalType.trim(),
    description: description.trim(),
    assistanceRequired: assistanceRequired.trim(),
    priority,
    location: {
      lat: Number(location.lat),
      lng: Number(location.lng),
      address: location.address || 'Map pin location',
    },
    photo: req.file ? `/uploads/${req.file.filename}` : '',
    imageStatus: req.imageCheck?.status,
    suggestedSpecies: req.imageCheck?.suggestedSpecies,
    confidence: req.imageCheck?.confidence,
    imageHash: req.imageCheck?.fileHash,
    reporterId: req.user._id,
  });
  res
    .status(201)
    .json({ message: 'Your report is saved and waiting for a quick verification.', report });
});

export const acceptReport = asyncHandler(async (req, res) => {
  const report = await AnimalReport.findOneAndUpdate(
    { _id: req.params.id, verified: true, status: 'Pending', assignedVolunteerId: null },
    { assignedVolunteerId: req.user._id, status: 'Accepted' },
    { new: true }
  );
  if (!report)
    throw new HttpError(
      409,
      'This request was already accepted or is not yet verified. Refresh the list and try another case.'
    );
  const full = await AnimalReport.findById(report._id).populate('reporterId', 'name phone email');
  res.json({
    message: 'You are now assigned to this rescue. Contact the reporter to coordinate.',
    report: full,
  });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const allowed = ['Accepted', 'In Progress', 'Resolved'];
  if (!allowed.includes(req.body.status))
    throw new HttpError(400, 'Choose Accepted, In Progress, or Resolved.');
  const report = await AnimalReport.findById(req.params.id);
  if (!report) throw new HttpError(404, 'Rescue report not found.');
  const isManager = req.user.role === 'admin' || req.user.role === 'shelter';
  if (!isManager && String(report.assignedVolunteerId) !== String(req.user._id))
    throw new HttpError(403, 'Only the assigned volunteer can update this rescue.');
  const transitions = {
    Pending: ['Accepted'],
    Accepted: ['In Progress'],
    'In Progress': ['Resolved'],
    Resolved: [],
  };
  if (!isManager && !transitions[report.status].includes(req.body.status))
    throw new HttpError(409, `A case marked ${report.status} cannot move to ${req.body.status}.`);
  report.status = req.body.status;
  await report.save();
  res.json({ message: `Rescue status updated to ${report.status}.`, report });
});

export const verifyReport = asyncHandler(async (req, res) => {
  const verified = req.body.verified === true || req.body.verified === 'true';
  const report = await AnimalReport.findByIdAndUpdate(
    req.params.id,
    { verified },
    { new: true, runValidators: true }
  );
  if (!report) throw new HttpError(404, 'Rescue report not found.');
  res.json({ report });
});

export const deleteReport = asyncHandler(async (req, res) => {
  const report = await AnimalReport.findByIdAndDelete(req.params.id);
  if (!report) throw new HttpError(404, 'Rescue report not found.');
  res.json({ message: 'The report was removed.' });
});