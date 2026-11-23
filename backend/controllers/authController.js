import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { HttpError, asyncHandler } from '../http.js';
import { signToken } from '../auth.js';
import crypto from 'node:crypto';
import { sendPasswordResetEmail } from '../mailer.js';

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  phone: user.phone,
  role: user.role,
  shelterId: user.shelterId || null,
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
    throw new HttpError(400, 'Name, email, phone, and password are required.');
  }
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');

  const SIGNUP_ROLES = ['user', 'volunteer', 'shelter'];
  const role = SIGNUP_ROLES.includes(req.body.role) ? req.body.role : 'user';

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing && existing.emailVerified) {
    throw new HttpError(409, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  if (existing && !existing.emailVerified) {
    existing.name = name.trim();
    existing.phone = phone.trim();
    existing.password = passwordHash;
    existing.role = role;
    await existing.save();
    return res.status(200).json({ token: signToken(existing), user: publicUser(existing) });
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password: passwordHash,
    role,
  });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new HttpError(400, 'Email and password are required.');
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password)))
    throw new HttpError(401, 'Email or password is incorrect.');
  if (!user.isActive)
    throw new HttpError(403, 'This account has been paused. Please contact PawCare support.');
  res.json({ token: signToken(user), user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => res.json({ user: publicUser(req.user) }));

const RESET_MINUTES = 30;
const RESET_COOLDOWN_MS = 60 * 1000;
const GENERIC_RESET_MESSAGE =
  'If an account exists for that email, a password reset link is on its way.';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) throw new HttpError(400, 'Please enter your email address.');

  const user = await User.findOne({ email }).select('+resetLastSentAt');
  const cooledDown =
    !user?.resetLastSentAt || Date.now() - user.resetLastSentAt.getTime() > RESET_COOLDOWN_MS;

  if (user && cooledDown) {
    const token = crypto.randomBytes(32).toString('hex');
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetTokenHash: hashToken(token),
          resetExpires: new Date(Date.now() + RESET_MINUTES * 60 * 1000),
          resetLastSentAt: new Date(),
        },
      }
    );
    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      await sendPasswordResetEmail(user.email, `${base}/reset-password?token=${token}`);
    } catch (error) {
      console.error('Password reset email failed:', error.message);
    }
  }

  // Same response whether or not the account exists, so the form can't reveal who has an account.
  res.json({ message: GENERIC_RESET_MESSAGE });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new HttpError(400, 'Reset link and new password are required.');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');

  const user = await User.findOne({
    resetTokenHash: hashToken(token),
    resetExpires: { $gt: new Date() },
  });
  if (!user)
    throw new HttpError(400, 'This reset link is invalid or has expired. Please request a new one.');

  const passwordHash = await bcrypt.hash(password, 12);
  await User.updateOne(
    { _id: user._id },
    {
      $set: { password: passwordHash },
      $unset: { resetTokenHash: '', resetExpires: '', resetLastSentAt: '' },
    }
  );

  res.json({ message: 'Your password has been reset. You can sign in now.' });
});