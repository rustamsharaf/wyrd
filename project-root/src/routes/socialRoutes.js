// src/routes/socialRoutes.js
import express from 'express';
import { followUser, unfollowUser, updateUserCountries } from '../controllers/socialController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/:id/follow', auth, followUser);
router.delete('/:id/unfollow', auth, unfollowUser);
router.put('/me/countries', auth, updateUserCountries);

export default router;