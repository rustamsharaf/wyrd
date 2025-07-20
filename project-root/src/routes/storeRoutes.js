import express from 'express';
import { 
  getStoreItems, 
  buyItem, 
  activateItem,
  getUserInventory
} from '../controllers/storeController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/items', auth, getStoreItems);
router.post('/buy/:itemId', auth, buyItem);
router.post('/activate/:id', auth, activateItem);
router.get('/inventory', auth, getUserInventory);

export default router;