import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { login, me, register, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticate } from '../auth.js';
import { validateRequest } from '../validate.js';
import { sendVerificationCode, verifyEmailCode } from '../controllers/verificationController.js';
import { checkEmailDomain } from '../emailCheck.js';

const router = Router();

// Limits how often a client can hit the code routes, to stop spam and brute-forcing.
const codeLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Try again in a few minutes.' },
});

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Enter your name.'),
    body('email')
      .isEmail()
      .withMessage('Enter a valid email.')
      .bail()
      .custom((value) => {
        const result = checkEmailDomain(value);
        if (!result.ok) throw new Error(result.message);
        return true;
      }),
    body('phone').trim().notEmpty().withMessage('Enter a phone number.'),
    body('password').isLength({ min: 8 }).withMessage('Use at least 8 characters for your password.'),
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Enter a valid email.'),
    body('password').notEmpty().withMessage('Enter your password.'),
  ],
  validateRequest,
  login
);

router.post('/forgot-password', codeLimiter, forgotPassword);
router.post('/reset-password', codeLimiter, resetPassword);
router.get('/me', authenticate, me);
router.post('/send-code', authenticate, codeLimiter, sendVerificationCode);
router.post('/verify-code', authenticate, codeLimiter, verifyEmailCode);

export default router;