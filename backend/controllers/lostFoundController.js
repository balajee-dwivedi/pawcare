import { LostFound } from '../models/LostFound.js';
import { HttpError, asyncHandler } from '../http.js';

const parseLocation = (value) => {
  if (!value) return undefined;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    throw new HttpError(400, 'Map location is invalid.');
  }
};

const isValidLocation = (location) =>
  location?.lat != null &&
  location?.lng != null &&
  Number.isFinite(Number(location.lat)) &&
  Number(location.lat) >= -90 &&
  Number(location.lat) <= 90 &&
  Number.isFinite(Number(location.lng)) &&
  Number(location.lng) >= -180 &&
  Number(location.lng) <= 180;

export const listLostFound = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.type) query.type = req.query.type;

  if (!req.user || req.user.role !== 'admin') {
    query.status = 'Open';
    // Hide photos that are waiting for a moderator's review
    query.imageStatus = { $ne: 'pending_review' };
  }

  const items = await LostFound.find(query)
    .sort({ createdAt: -1 })
    .populate('reporterId', 'name');
  res.json({ items });
});

export const createLostFound = asyncHandler(async (req, res) => {
  const { type, animalType, description, contact } = req.body;
  if (
    !['lost', 'found'].includes(type) ||
    !animalType?.trim() ||
    !description?.trim() ||
    !contact?.trim()
  ) {
    throw new HttpError(
      400,
      'Choose Lost or Found and provide animal type, description, and contact details.'
    );
  }

  const location = parseLocation(req.body.location);
  if (!isValidLocation(location)) {
    throw new HttpError(400, 'Choose a valid lost/found location on the map.');
  }

  const item = await LostFound.create({
    type,
    animalType,
    description,
    contact,
    location,
    photo: req.file ? `/uploads/${req.file.filename}` : '',
    imageStatus: req.imageCheck?.status,
    suggestedSpecies: req.imageCheck?.suggestedSpecies,
    confidence: req.imageCheck?.confidence,
    imageHash: req.imageCheck?.fileHash,
    reporterId: req.user._id,
  });
  res.status(201).json({ item });
});

export const updateLostFoundStatus = asyncHandler(async (req, res) => {
  if (!['Open', 'Reunited', 'Closed'].includes(req.body.status)) {
    throw new HttpError(400, 'Choose Open, Reunited, or Closed.');
  }

  const item = await LostFound.findById(req.params.id);
  if (!item) throw new HttpError(404, 'Lost/found report not found.');

  if (req.user.role !== 'admin' && String(item.reporterId) !== String(req.user._id)) {
    throw new HttpError(403, 'Only the person who reported this pet can update it.');
  }

  item.status = req.body.status;
  await item.save();
  res.json({ item });
});