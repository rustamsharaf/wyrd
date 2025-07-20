const GameRound = require('../models/GameRound');
const User = require('../models/User');
const { io } = require('../socket');
const logger = require('../utils/logger');

// аварийное задание шара
exports.emergencySetBall = async (req, res) => {
  const { ballNumber, roundId } = req.body;
  try {
    const round = await GameRound.findById(roundId);
    if (!round) return res.status(404).json({ message: 'Раунд не найден' });

    round.winningBall = ballNumber;
    round.status = 'completed';
    await round.save();

    // вызываем расчёт вручную
    await require('../services/calculationService').calculateResults(round._id, ballNumber);
    io.emit('roundResult', { roundId: round._id, winningBall: ballNumber, emergency: true });

    logger.info(`Админ вручную задал шар ${ballNumber} в раунде ${roundId}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// push-уведомления
exports.sendPush = async (req, res) => {
  const { title, body, target = 'all', countries = [], userIds = [] } = req.body;

  const query = {};
  if (target === 'online') query.isOnline = true;
  if (target === 'offline') query.isOnline = false;
  if (countries.length) query.country = { $in: countries };
  if (userIds.length) query._id = { $in: userIds };

  const users = await User.find(query).select('_id'); // тут может быть FCM-токен
  const payload = { title, body, date: new Date() };

  // отправляем всем подписавшимся
  io.to('global').emit('push', payload);
  if (countries.length) io.to(countries).emit('push', payload);
  if (userIds.length) userIds.forEach(id => io.to(id.toString()).emit('push', payload));

  logger.info(`Push отправлен ${users.length} пользователям`);
  res.json({ success: true, recipients: users.length });
};

// список/блокировка пользователей
exports.listUsers = async (_, res) => {
  const users = await User.find().select('-passwordHash');
  res.json(users);
};

exports.banUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { status: 'banned' });
  res.json({ success: true });
};