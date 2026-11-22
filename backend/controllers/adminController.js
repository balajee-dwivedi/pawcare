import { User } from '../models/User.js';
import { Volunteer } from '../models/Volunteer.js';
import { AnimalReport } from '../models/AnimalReport.js';
import { Adoption } from '../models/Adoption.js';
import { Shelter } from '../models/Shelter.js';
import { HttpError, asyncHandler } from '../http.js';

export const overview = asyncHandler(async (_req, res) => {
  const [users, volunteers, reports, pendingReports, openReports, adoptions, shelters] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'volunteer' }),
    AnimalReport.countDocuments(),
    AnimalReport.countDocuments({ verified: false }),
    AnimalReport.countDocuments({ status: { $ne: 'Resolved' } }),
    Adoption.countDocuments({ adoptionStatus: 'Available' }),
    Shelter.countDocuments(),
  ]);
  const recentReports = await AnimalReport.find()
    .sort({ date: -1 })
    .populate('reporterId', 'name email phone')
    .populate('assignedVolunteerId', 'name');
  const people = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({
    stats: { users, volunteers, reports, pendingReports, openReports, availableAdoptions: adoptions, shelters },
    recentReports,
    usersList: people,
  });
});

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ users });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found.');
  if (user._id.equals(req.user._id) && req.body.isActive === false)
    throw new HttpError(400, 'You cannot deactivate your own admin account.');
  if (req.body.role && ['user', 'volunteer', 'shelter', 'admin'].includes(req.body.role))
    user.role = req.body.role;
  if (typeof req.body.isActive === 'boolean') user.isActive = req.body.isActive;
  if (req.body.phone) user.phone = req.body.phone;
  await user.save();
  if (user.role === 'volunteer')
    await Volunteer.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          userId: user._id,
          name: user.name,
          contact: user.phone,
          area: 'Set your service area',
        },
      },
      { upsert: true }
    );
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
    },
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id)
    throw new HttpError(400, 'You cannot delete your own account.');
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new HttpError(404, 'User not found.');
  await Volunteer.deleteOne({ userId: user._id });
  res.json({ message: 'User account removed.' });
});
