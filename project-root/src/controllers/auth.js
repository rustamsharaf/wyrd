import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Регистрация пользователя
export const register = async (req, res) => {
  try {
    const { nickname, email, password, country } = req.body;
    
    // Проверка существования пользователя
    const existingUser = await User.findOne({ $or: [{ email }, { nickname }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email или nickname уже существует' });
    }

    // Создание нового пользователя
    const newUser = new User({
      nickname,
      email,
      password,
      country,
      currency: 100,
      ratingPoints: 0
    });

    await newUser.save();
    res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Вход пользователя
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Поиск пользователя
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    // Проверка пароля
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    // Генерация JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};