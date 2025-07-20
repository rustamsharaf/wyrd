// routes/gameRoutes.js
import express from 'express';
import { placeBet } from '../controllers/gameController.js';
import auth from '../middleware/auth.js'; // Предполагается, что authMiddleware экспортируется как auth

const router = express.Router();

router.post('/bet', auth, placeBet);

export default router;