import fs from 'node:fs';
import { checkAnimalImage } from '../imageCheck.js';

// Used on routes where a photo is required (adoption listings).
// Rejects bad photos, otherwise stores the result on req.imageCheck.
export async function checkAnimalPhoto(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ message: 'Please attach a photo of the animal.' });
  }

  try {
    const check = await checkAnimalImage(req.file.path);

    if (check.status === 'rejected') {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(422).json({ message: check.reason });
    }

    req.imageCheck = check;
    next();
  } catch (error) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    next(error);
  }
}

// Used on routes where a photo is optional (lost and found reports).
// Skips the check when no photo was sent.
export async function checkOptionalAnimalPhoto(req, res, next) {
  if (!req.file) return next();
  return checkAnimalPhoto(req, res, next);
}