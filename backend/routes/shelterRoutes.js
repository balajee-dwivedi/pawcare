import { Router } from 'express';
import { allowRoles, authenticate } from '../auth.js';
import {
  createShelter,
  deleteShelter,
  incomingRequests,
  listShelters,
  updateShelter,
} from '../controllers/shelterController.js';

const router = Router();
router.get('/', listShelters);
router.get('/requests', authenticate, allowRoles('shelter', 'admin'), incomingRequests);
router.post('/', authenticate, allowRoles('shelter', 'admin'), createShelter);
router.patch('/:id', authenticate, allowRoles('shelter', 'admin'), updateShelter);
router.delete('/:id', authenticate, allowRoles('admin'), deleteShelter);
export default router;
