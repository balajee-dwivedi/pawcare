import crypto from 'node:crypto';
import { User } from '../models/User.js';
import { HttpError, asyncHandler } from '../http.js';
import { sendVerificationEmail } from '../mailer.js';

const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export const sendVerificationCode = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+verifyCodeHash');
  if (!user) throw new HttpError(404, 'Account not found.');
  if (user.emailVerified) return res.json({ message: 'Your email is already verified.' });

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');

  // updateOne avoids re-validating the whole user, including the password field.
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        verifyCodeHash: hashCode(code),
        verifyExpires: new Date(Date.now() + CODE_MINUTES * 60_000),
        verifyAttempts: 0,
      },
    }
  );

  await sendVerificationEmail(user.email, code);
  res.json({ message: 'We sent a 6-digit code to your email.' });
});

export const verifyEmailCode = asyncHandler(async (req, res) => {
  const code = String(req.body.code || '').trim();
  if (!/^\d{6}$/.test(code)) throw new HttpError(400, 'Enter the 6-digit code from your email.');

  const user = await User.findById(req.user._id).select('+verifyCodeHash +verifyExpires +verifyAttempts');
  if (!user) throw new HttpError(404, 'Account not found.');
  if (user.emailVerified) return res.json({ message: 'Your email is already verified.' });

  if (!user.verifyCodeHash || !user.verifyExpires || user.verifyExpires < new Date())
    throw new HttpError(400, 'This code has expired. Request a new one.');

  if (user.verifyAttempts >= MAX_ATTEMPTS)
    throw new HttpError(429, 'Too many attempts. Request a new code.');

  if (hashCode(code) !== user.verifyCodeHash) {
    await User.updateOne({ _id: user._id }, { $inc: { verifyAttempts: 1 } });
    throw new HttpError(400, 'That code is incorrect.');
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: { emailVerified: true },
      $unset: { verifyCodeHash: '', verifyExpires: '', verifyAttempts: '' },
    }
  );
  res.json({ message: 'Your email is verified.' });
});