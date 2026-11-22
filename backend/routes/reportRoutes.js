import { Router } from 'express';
import { authenticate, allowRoles, optionalAuthenticate } from '../auth.js';
import { photoUpload } from '../upload.js';
import { checkOptionalAnimalPhoto } from '../middleware/checkAnimalPhoto.js';
import {
  acceptReport,
  createReport,
  deleteReport,
  getMyReports,
  listReports,
  updateStatus,
  verifyReport,
} from '../controllers/reportController.js';

const router = Router();
router.get(
  '/mine',
  authenticate,
  allowRoles('user', 'volunteer', 'shelter', 'admin'),
  getMyReports
);
router.get('/', optionalAuthenticate, listReports);
router.post(
  '/',
  authenticate,
  allowRoles('user', 'volunteer', 'shelter', 'admin'),
  photoUpload.single('photo'),
  checkOptionalAnimalPhoto,
  createReport
);
router.post('/:id/accept', authenticate, allowRoles('volunteer'), acceptReport);
router.patch(
  '/:id/status',
  authenticate,
  allowRoles('volunteer', 'shelter', 'admin'),
  updateStatus
);
router.patch('/:id/verify', authenticate, allowRoles('admin'), verifyReport);
router.delete('/:id', authenticate, allowRoles('admin'), deleteReport);
export default router;