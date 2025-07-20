// src/controllers/socialController.js
import User from '../models/User.js';
import logger from '../logger.js';

export const followUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const userToFollowId = req.params.id;

    // Нельзя подписаться на себя
    if (currentUser._id.equals(userToFollowId)) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    // Проверяем, существует ли пользователь
    const userToFollow = await User.findById(userToFollowId);
    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Если уже подписан, то ничего не делаем
    if (currentUser.following.includes(userToFollowId)) {
      return res.status(200).json({ message: "Already following" });
    }

    // Добавляем в подписки
    currentUser.following.push(userToFollowId);
    await currentUser.save();

    // Добавляем в подписчики пользователю
    userToFollow.followers.push(currentUser._id);
    await userToFollow.save();

    logger.info(`User ${currentUser._id} followed ${userToFollowId}`);
    res.status(200).json({ message: "Successfully followed" });
  } catch (err) {
    logger.error(`Follow error: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const userToUnfollowId = req.params.id;

    // Удаляем из подписок
    currentUser.following = currentUser.following.filter(id => !id.equals(userToUnfollowId));
    await currentUser.save();

    // Удаляем из подписчиков пользователя
    const userToUnfollow = await User.findById(userToUnfollowId);
    if (userToUnfollow) {
      userToUnfollow.followers = userToUnfollow.followers.filter(id => !id.equals(currentUser._id));
      await userToUnfollow.save();
    }

    logger.info(`User ${currentUser._id} unfollowed ${userToUnfollowId}`);
    res.status(200).json({ message: "Successfully unfollowed" });
  } catch (err) {
    logger.error(`Unfollow error: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserCountries = async (req, res) => {
  try {
    const { countries } = req.body;
    const user = req.user;

    user.countries = countries;
    await user.save();

    // Обновляем комнаты в сокетах
    const io = getIo();
    const userSockets = await io.in(user._id.toString()).fetchSockets();
    
    userSockets.forEach(socket => {
      // Покидаем все комнаты стран
      Object.keys(socket.rooms).forEach(room => {
        if (room.startsWith('country_')) {
          socket.leave(room);
        }
      });
      
      // Присоединяем к новым странам
      countries.forEach(country => {
        socket.join(`country_${country}`);
      });
    });

    res.status(200).json({ message: "Countries updated", countries: user.countries });
  } catch (err) {
    logger.error(`Update countries error: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
};