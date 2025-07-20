import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import auth from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Подключение к БД
connectDB();

// Маршруты
app.use('/api/auth', authRoutes);

// Защищенный маршрут (пример)
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'Доступ разрешен', userId: req.userId });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});