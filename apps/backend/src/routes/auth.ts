import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

// Authentication routes
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.post('/refresh', asyncHandler(authController.refreshToken));
router.get('/profile', asyncHandler(authController.getProfile));

// Child profile management
router.post('/children', asyncHandler(authController.createChildProfile));
router.get('/children', asyncHandler(authController.getChildProfiles));
router.put('/children/:id', asyncHandler(authController.updateChildProfile));
router.delete('/children/:id', asyncHandler(authController.deleteChildProfile));

export { router as authRoutes };