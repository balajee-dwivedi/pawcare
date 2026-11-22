import { Shelter } from '../models/Shelter.js';
import { AnimalReport } from '../models/AnimalReport.js';
import { HttpError, asyncHandler } from '../http.js';

const normalizeLocation = (location) => {
  if (!location) return undefined;
  try {
    return typeof location === 'string' ? JSON.parse(location) : location;
  } catch {
    throw new HttpError(400, 'Shelter map location is invalid.');
  }
};

const isValidLocation = (location) =>
  location?.lat != null &&
  location?.lng != null &&
  Number.isFinite(Number(location?.lat)) &&
  Number(location.lat) >= -90 &&
  Number(location.lat) <= 90 &&
  Number.isFinite(Number(location?.lng)) &&
  Number(location.lng) >= -180 &&
  Number(location.lng) <= 180;

export const listShelters = asyncHandler(async (_req, res) => {
  const shelters = await Shelter.find().sort({ name: 1 });
  res.json({ shelters });
});

export const createShelter = asyncHandler(async (req, res) => {
  const { name, address, phone, email, description } = req.body;
  if (![name, address, phone, email, description].every((value) => value?.trim()))
    throw new HttpError(400, 'Name, address, phone, email, and description are required.');
  const location = normalizeLocation(req.body.location);
  if (!isValidLocation(location)) throw new HttpError(400, 'Choose a valid shelter location on the map.');
  const shelter = await Shelter.create({
    name,
    address,
    phone,
    email,
    description,
    location,
  });
  if (req.user.role === 'shelter') {
    req.user.shelterId = shelter._id;
    await req.user.save();
  }
  res.status(201).json({ shelter });
});

export const updateShelter = asyncHandler(async (req, res) => {
  const shelter = await Shelter.findById(req.params.id);
  if (!shelter) throw new HttpError(404, 'Shelter not found.');
  if (req.user.role !== 'admin' && String(req.user.shelterId) !== String(shelter._id))
    throw new HttpError(403, 'You can only update your own shelter.');
  for (const key of ['name', 'address', 'phone', 'email', 'description'])
    if (req.body[key] !== undefined) shelter[key] = req.body[key];
  if (req.body.location) {
    const location = normalizeLocation(req.body.location);
    if (!isValidLocation(location)) throw new HttpError(400, 'Choose a valid shelter location on the map.');
    shelter.location = location;
  }
  await shelter.save();
  res.json({ shelter });
});

export const deleteShelter = asyncHandler(async (req, res) => {
  const shelter = await Shelter.findById(req.params.id);
  if (!shelter) throw new HttpError(404, 'Shelter not found.');
  await Shelter.findByIdAndDelete(shelter._id);
  res.json({ message: 'Shelter removed.' });
});

export const incomingRequests = asyncHandler(async (_req, res) => {
  const reports = await AnimalReport.find({
    verified: true,
    status: { $in: ['Pending', 'Accepted', 'In Progress'] },
  })
    .sort({ priority: -1, date: 1 })
    .populate('assignedVolunteerId', 'name');
  res.json({ reports });
});
