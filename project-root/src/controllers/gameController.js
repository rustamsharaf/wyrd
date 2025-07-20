import Bet from '../models/Bet.js';
import User from '../models/User.js';
import GameRound from '../models/GameRound.js';
import { getIo } from '../socket.js';

export const placeBet = async (req, res) => {
  try {
    const { ballNumber, amount } = req.body;
    const userId = req.userId;

    // Проверка допустимых значений
    const validBalls = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'joker'];
    if (!validBalls.includes(ballNumber)) {
      return res.status(400).json({ message: 'Неверный номер шара' });
    }

    // Получаем активный раунд
    const currentRound = await GameRound.findOne({ status: 'betting' });
    if (!currentRound) {
      return res.status(400).json({ message: 'Прием ставок завершен' });
    }

    // Проверяем баланс пользователя
    const user = await User.findById(userId);
    if (user.currency < amount) {
      return res.status(400).json({ message: 'Недостаточно средств' });
    }

    // Создаем ставку
    const bet = new Bet({
      user: userId,
      round: currentRound._id,
      ballNumber,
      amount
    });

    // Списание средств
    user.currency -= amount;
    await user.save();
    await bet.save();

    // Отправляем обновленный баланс через сокет
    const io = getIo();
    io.to(userId.toString()).emit('balanceUpdate', { currency: user.currency });

    res.status(201).json({ message: 'Ставка принята', bet });

  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};