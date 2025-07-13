import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ProgressController } from '../controllers/ProgressController';

const router = Router();
const progressController = new ProgressController();

// Reading session routes
router.post('/sessions', asyncHandler(progressController.createSession));
router.get('/sessions/:childId', asyncHandler(progressController.getSessions));
router.put('/sessions/:id', asyncHandler(progressController.updateSession));
router.get('/sessions/:id', asyncHandler(progressController.getSessionById));

// Progress tracking routes
router.get('/analytics/:childId', asyncHandler(progressController.getAnalytics));
router.get('/reports/:childId', asyncHandler(progressController.getProgressReport));

// Achievement routes
router.get('/achievements/:childId', asyncHandler(progressController.getAchievements));
router.post('/achievements/:childId/unlock', asyncHandler(progressController.unlockAchievement));

export { router as progressRoutes };