const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/authMiddleware');
const {
  emergencySetBall,
  sendPush,
  listUsers,
  banUser
} = require('../controllers/adminController');

const router = express.Router();

// только админ
const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Access denied' });

router.put('/emergency-ball', auth, adminOnly, body('ballNumber').isIn(['0','1','2','3','4','5','6','7','8','9','joker']), emergencySetBall);
router.post('/push', auth, adminOnly, sendPush);
router.get('/users', auth, adminOnly, listUsers);
router.put('/ban/:id', auth, adminOnly, banUser);

module.exports = router;