import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { StoryController } from '../controllers/StoryController';

const router = Router();
const storyController = new StoryController();

// Story management routes
router.post('/generate', asyncHandler(storyController.generateStory.bind(storyController)));
router.get('/', asyncHandler(storyController.getStories.bind(storyController)));
router.get('/:id', asyncHandler(storyController.getStoryById.bind(storyController)));
router.post('/:id/favorite', asyncHandler(storyController.favoriteStory.bind(storyController)));
router.delete('/:id/favorite', asyncHandler(storyController.unfavoriteStory.bind(storyController)));

// Story library routes
router.get('/library/featured', asyncHandler(storyController.getFeaturedStories.bind(storyController)));
router.get('/library/recommended/:childId', asyncHandler(storyController.getRecommendedStories.bind(storyController)));

export { router as storyRoutes };