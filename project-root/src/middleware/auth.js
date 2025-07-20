import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../logger.js';

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Отсутствует токен аутентификации' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.warn(`Ошибка аутентификации: ${err.message}`);
    res.status(401).json({ message: 'Недействительный токен' });
  }
};

export default auth;