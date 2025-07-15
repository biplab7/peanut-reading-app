import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { ProgressController } from '../controllers/ProgressController';

const router = Router();
const progressController = new ProgressController();

// Reading session routes (require authentication)
router.post('/sessions', authenticateToken, asyncHandler(progressController.createSession));
router.get('/sessions/:childId', authenticateToken, asyncHandler(progressController.getSessions));
router.put('/sessions/:id', authenticateToken, asyncHandler(progressController.updateSession));
router.get('/sessions/:id', authenticateToken, asyncHandler(progressController.getSessionById));

// Progress tracking routes (require authentication)
router.get('/analytics/:childId', authenticateToken, asyncHandler(progressController.getAnalytics));
router.get('/reports/:childId', authenticateToken, asyncHandler(progressController.getProgressReport));

// Achievement routes (require authentication)
router.get('/achievements/:childId', authenticateToken, asyncHandler(progressController.getAchievements));
router.post('/achievements/:childId/unlock', authenticateToken, asyncHandler(progressController.unlockAchievement));

export { router as progressRoutes };