import express from 'express';
import auth from '../middleware/auth.js';
import { placeBet } from '../controllers/gameController.js';

const router = express.Router();

router.post('/bet', auth, placeBet);

export default router;