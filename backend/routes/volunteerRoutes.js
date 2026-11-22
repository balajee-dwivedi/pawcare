import { Router } from 'express';
import { allowRoles, authenticate } from '../auth.js';
import { requestQueue, updateAvailability, volunteerSummary } from '../controllers/volunteerController.js';

const router = Router();
router.use(authenticate, allowRoles('volunteer', 'admin'));
router.get('/requests', requestQueue);
router.get('/summary', volunteerSummary);
router.patch('/availability', allowRoles('volunteer'), updateAvailability);
export default router;
