import Item from '../models/Item.js';
import Inventory from '../models/Inventory.js';
import User from '../models/User.js';
import logger from '../logger.js';

// Получение доступных товаров
export const getStoreItems = async (req, res) => {
  try {
    const userRating = req.user.ratingPoints || 0;
    
    // Получаем товары, доступные для уровня рейтинга пользователя
    const items = await Item.find({ ratingRequired: { $lte: userRating } });
    
    // Группируем по категориям
    const categorizedItems = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
    
    res.json(categorizedItems);
  } catch (err) {
    logger.error(`Ошибка получения товаров: ${err.message}`);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Покупка товара
export const buyItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const userId = req.user._id;
    const itemId = req.params.itemId;
    
    // Получаем пользователя с актуальным балансом
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    
    // Получаем товар
    const item = await Item.findById(itemId).session(session);
    if (!item) {
      throw new Error('Товар не найден');
    }
    
    // Проверяем доступность по рейтингу
    if (user.ratingPoints < item.ratingRequired) {
      throw new Error('Недостаточный рейтинг для покупки');
    }
    
    // Проверяем баланс
    if (user.currency < item.price) {
      throw new Error('Недостаточно средств');
    }
    
    // Рассчитываем дату истечения срока действия
    let expiresAt = null;
    if (item.duration > 0) {
      expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + item.duration);
    }
    
    // Создаем запись в инвентаре
    const inventoryItem = new Inventory({
      user: userId,
      item: itemId,
      expiresAt,
      isActive: item.duration === 0 // Вечные предметы сразу активны
    });
    
    // Списание средств
    user.currency -= item.price;
    
    // Сохраняем изменения
    await user.save({ session });
    await inventoryItem.save({ session });
    
    // Применяем немедленный эффект, если есть
    if (item.effectValue !== 0) {
      switch (item.effect) {
        case 'currency':
          user.currency += item.effectValue;
          break;
        case 'rating':
          user.ratingPoints += item.effectValue;
          break;
      }
      await user.save({ session });
    }
    
    // Фиксируем транзакцию
    await session.commitTransaction();
    session.endSession();
    
    // Отправляем обновление баланса через сокет
    const io = getIo();
    io.to(userId.toString()).emit('balanceUpdate', {
      currency: user.currency,
      rating: user.ratingPoints
    });
    
    res.json({
      success: true,
      message: 'Покупка успешна',
      newBalance: user.currency,
      inventoryItem
    });
    
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    logger.error(`Ошибка покупки: ${err.message}`, { userId: req.user._id, itemId });
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Активация предмета
export const activateItem = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const userId = req.user._id;
    
    // Находим предмет в инвентаре
    const inventoryItem = await Inventory.findById(inventoryId).populate('item');
    if (!inventoryItem || !inventoryItem.item) {
      return res.status(404).json({ message: 'Предмет не найден' });
    }
    
    // Проверяем, что предмет принадлежит пользователю
    if (!inventoryItem.user.equals(userId)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    // Проверяем срок действия
    if (inventoryItem.expiresAt && new Date() > inventoryItem.expiresAt) {
      return res.status(400).json({ message: 'Срок действия предмета истек' });
    }
    
    // Активируем предмет
    inventoryItem.isActive = true;
    await inventoryItem.save();
    
    res.json({
      success: true,
      message: 'Предмет активирован',
      inventoryItem
    });
    
  } catch (err) {
    logger.error(`Ошибка активации предмета: ${err.message}`);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Получение инвентаря пользователя
export const getUserInventory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Получаем инвентарь с информацией о предметах
    const inventory = await Inventory.find({ user: userId })
      .populate('item')
      .sort({ createdAt: -1 });
    
    res.json(inventory);
  } catch (err) {
    logger.error(`Ошибка получения инвентаря: ${err.message}`);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};