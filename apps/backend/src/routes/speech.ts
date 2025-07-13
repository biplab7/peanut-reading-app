import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/errorHandler';
import { SpeechController } from '../controllers/SpeechController';

const router = Router();
const speechController = new SpeechController();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio format'));
    }
  },
});

// Speech recognition routes
router.post('/recognize', upload.single('audio'), asyncHandler(speechController.recognizeSpeech));
router.post('/analyze', asyncHandler(speechController.analyzeSpeech));
router.post('/feedback', asyncHandler(speechController.generateFeedback));

// Text-to-speech routes
router.post('/synthesize', asyncHandler(speechController.synthesizeText));

export { router as speechRoutes };