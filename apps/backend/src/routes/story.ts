import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { StoryController } from '../controllers/StoryController';

const router = Router();
const storyController = new StoryController();

// Story management routes
router.post('/generate', asyncHandler(storyController.generateStory));
router.get('/', asyncHandler(storyController.getStories));
router.get('/:id', asyncHandler(storyController.getStoryById));
router.post('/:id/favorite', asyncHandler(storyController.favoriteStory));
router.delete('/:id/favorite', asyncHandler(storyController.unfavoriteStory));

// Story library routes
router.get('/library/featured', asyncHandler(storyController.getFeaturedStories));
router.get('/library/recommended/:childId', asyncHandler(storyController.getRecommendedStories));

export { router as storyRoutes };