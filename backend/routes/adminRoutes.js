import { Router } from 'express';
import { allowRoles, authenticate } from '../auth.js';
import { deleteUser, listUsers, overview, updateUser } from '../controllers/adminController.js';

const router = Router();
router.use(authenticate, allowRoles('admin'));
router.get('/overview', overview);
router.get('/users', listUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
export default router;
