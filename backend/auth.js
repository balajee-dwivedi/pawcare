import jwt from 'jsonwebtoken';
import { User } from './models/User.js';
import { HttpError, asyncHandler } from './http.js';

const jwtSecret = () => {
  const secret = process.env.PAWCARE_JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production')
    throw new Error('PAWCARE_JWT_SECRET must be configured in production.');
  return 'local-lab-secret-change-me-before-deploying';
};

export function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, jwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function attachUser(req, optional = false) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) {
    if (optional) return null;
    throw new HttpError(401, 'Please sign in to continue.');
  }
  let payload;
  try {
    payload = jwt.verify(token, jwtSecret());
  } catch {
    throw new HttpError(401, 'Your session is invalid or has expired. Please sign in again.');
  }
  const user = await User.findById(payload.id).select('-password');
  if (!user || !user.isActive) throw new HttpError(401, 'This account is unavailable.');
  req.user = user;
  return user;
}

/** Require a signed bearer token and resolve its current database user. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  await attachUser(req);
  next();
});

/** Resolve a token when supplied, while keeping collection browsing public. */
export const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  await attachUser(req, true);
  next();
});

/** Restrict a route to one or more account roles. */
export const allowRoles =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
