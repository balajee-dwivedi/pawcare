import { Adoption } from '../models/Adoption.js';
import { Shelter } from '../models/Shelter.js';
import { HttpError, asyncHandler } from '../http.js';

export const listAdoptions = asyncHandler(async (req, res) => {
  const query = {};
  if (req.user?.role === 'shelter') {
    if (!req.user.shelterId) return res.json({ adoptions: [] });
    query.shelterId = req.user.shelterId;
    if (req.query.status !== 'all') query.adoptionStatus = req.query.status || 'Available';
  } else if (req.user?.role === 'admin') {
    if (req.query.status && req.query.status !== 'all') query.adoptionStatus = req.query.status;
  } else {
    query.adoptionStatus = 'Available';
  }
  const adoptions = await Adoption.find(query)
    .sort({ createdAt: -1 })
    .populate('shelterId', 'name address phone email');
  res.json({ adoptions });
});

export const createAdoption = asyncHandler(async (req, res) => {
  const shelterId = req.user.role === 'admin' ? req.body.shelterId : req.user.shelterId;
  if (req.user.role !== 'admin') {
    if (!shelterId)
      throw new HttpError(400, 'Add your shelter details before creating an adoption listing.');
    const shelter = await Shelter.findById(shelterId);
    if (!shelter)
      throw new HttpError(400, 'Add your shelter details before creating an adoption listing.');
  }
  const { animalType, age, gender, description } = req.body;
  if (!animalType?.trim() || !age?.trim() || !description?.trim() || !shelterId)
    throw new HttpError(400, 'Animal type, age, description and shelter are required.');
  const adoption = await Adoption.create({
    animalType,
    age,
    gender,
    description,
    shelterId,
    photo: req.file ? `/uploads/${req.file.filename}` : '',
  });
  res.status(201).json({ adoption });
});

export const updateAdoption = asyncHandler(async (req, res) => {
  const adoption = await Adoption.findById(req.params.id);
  if (!adoption) throw new HttpError(404, 'Adoption listing not found.');
  if (req.user.role !== 'admin' && String(adoption.shelterId) !== String(req.user.shelterId))
    throw new HttpError(403, 'You can only manage listings from your shelter.');
  const allowed = ['animalType', 'age', 'gender', 'description', 'adoptionStatus'];
  for (const key of allowed) if (req.body[key] !== undefined) adoption[key] = req.body[key];
  if (req.file) adoption.photo = `/uploads/${req.file.filename}`;
  await adoption.save();
  res.json({ adoption });
});
