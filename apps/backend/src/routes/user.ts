import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { UserController } from '../controllers/UserController';

const router = Router();
const userController = new UserController();

// User profile routes
router.get('/profile', asyncHandler(userController.getProfile));
router.put('/profile', asyncHandler(userController.updateProfile));

// Child management routes
router.post('/children', asyncHandler(userController.createChild));
router.get('/children', asyncHandler(userController.getChildren));
router.get('/children/:id', asyncHandler(userController.getChildById));
router.put('/children/:id', asyncHandler(userController.updateChild));
router.delete('/children/:id', asyncHandler(userController.deleteChild));

// Settings routes
router.get('/settings', asyncHandler(userController.getSettings));
router.put('/settings', asyncHandler(userController.updateSettings));

export { router as userRoutes };