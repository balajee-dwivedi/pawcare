import { Router } from 'express';
import { allowRoles, authenticate } from '../auth.js';
import { photoUpload } from '../upload.js';
import { checkOptionalAnimalPhoto } from '../middleware/checkAnimalPhoto.js';
import { createLostFound, listLostFound, updateLostFoundStatus } from '../controllers/lostFoundController.js';

const router = Router();
router.get('/', listLostFound);
router.post(
  '/',
  authenticate,
  allowRoles('user', 'volunteer', 'shelter', 'admin'),
  photoUpload.single('photo'),
  checkOptionalAnimalPhoto,
  createLostFound
);
router.patch('/:id/status', authenticate, allowRoles('user', 'admin'), updateLostFoundStatus);
export default router;