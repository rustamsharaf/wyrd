const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerValidator, loginValidator } = require('../utils/validators');

exports.register = async (req, res) => {
  const { error } = registerValidator(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { nickname, email, password, country } = req.body;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ nickname, email, passwordHash, country });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ message: `${field} уже занят` });
    }
    console.error(err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.login = async (req, res) => {
  const { error } = loginValidator(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Неверный email или пароль' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Неверный email или пароль' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};