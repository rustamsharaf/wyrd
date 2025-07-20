import express from 'express';
import { updateConfig } from '../controllers/adminController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.put('/config', auth, updateConfig);

export default router;