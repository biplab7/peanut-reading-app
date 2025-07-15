import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

// Authentication routes
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.post('/refresh', asyncHandler(authController.refreshToken));
router.get('/profile', asyncHandler(authController.getProfile));

// Child profile management (requires authentication)
router.post('/children', authenticateToken, asyncHandler(authController.createChildProfile));
router.get('/children', authenticateToken, asyncHandler(authController.getChildProfiles));
router.put('/children/:id', authenticateToken, asyncHandler(authController.updateChildProfile));
router.delete('/children/:id', authenticateToken, asyncHandler(authController.deleteChildProfile));

export { router as authRoutes };