import { Router } from 'express';
import { allowRoles, authenticate, optionalAuthenticate } from '../auth.js';
import { photoUpload } from '../upload.js';
   import { checkAnimalPhoto, checkOptionalAnimalPhoto } from '../middleware/checkAnimalPhoto.js';
import { createAdoption, listAdoptions, updateAdoption } from '../controllers/adoptionController.js';

const router = Router();

router.get('/', optionalAuthenticate, listAdoptions);

router.post(
  '/',
  authenticate,
  allowRoles('shelter', 'admin'),
  photoUpload.single('photo'),
  checkAnimalPhoto,
  createAdoption
);

router.patch(
  '/:id',
  authenticate,
  allowRoles('shelter', 'admin'),
  photoUpload.single('photo'),
  checkOptionalAnimalPhoto,
  updateAdoption
);

export default router;