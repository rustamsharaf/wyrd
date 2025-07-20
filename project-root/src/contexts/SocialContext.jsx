// src/contexts/SocialContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useGameContext } from './GameContext';

const SocialContext = createContext();

export const useSocialContext = () => useContext(SocialContext);

export const SocialProvider = ({ children }) => {
  const { socket } = useGameContext();
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [guideBets, setGuideBets] = useState([]);
  const [countryChats, setCountryChats] = useState({});
  const [activeChatCountry, setActiveChatCountry] = useState(null);

  // Загрузка подписок и подписчиков
  useEffect(() => {
    const loadSocialData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/me/social', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setFollowing(data.following);
        setFollowers(data.followers);
      } catch (err) {
        console.error('Error loading social data:', err);
      }
    };

    loadSocialData();
  }, []);

  // Обработчик ставок от гайдов
  useEffect(() => {
    if (!socket) return;

    const handleGuideBet = (bet) => {
      setGuideBets(prev => [...prev, bet]);
    };

    socket.on('guideBet', handleGuideBet);

    return () => {
      socket.off('guideBet', handleGuideBet);
    };
  }, [socket]);

  // Обработчик сообщений чата
  useEffect(() => {
    if (!socket) return;

    const handleCountryMessage = (message) => {
      setCountryChats(prev => ({
        ...prev,
        [message.country]: [...(prev[message.country] || []), message]
      }));
    };

    socket.on('countryMessage', handleCountryMessage);

    return () => {
      socket.off('countryMessage', handleCountryMessage);
    };
  }, [socket]);

  // Функция для отправки сообщения
  const sendMessage = (country, text) => {
    if (socket && text.trim()) {
      socket.emit('chatMessage', { country, text });
    }
  };

  // Функция для загрузки истории чата
  const loadChatHistory = (country) => {
    if (socket) {
      socket.emit('getChatHistory', country);
    }
  };

  // Функция для смены активной страны чата
  const setActiveCountry = (country) => {
    setActiveChatCountry(country);
    if (!countryChats[country]) {
      loadChatHistory(country);
    }
  };

  return (
    <SocialContext.Provider value={{
      following,
      followers,
      guideBets,
      countryChats,
      activeChatCountry,
      setActiveCountry,
      sendMessage,
      followUser: async (userId) => {
        // Вызов API для подписки
        // Обновление локального состояния
      },
      unfollowUser: async (userId) => {
        // Вызов API для отписки
        // Обновление локального состояния
      },
      updateCountries: async (countries) => {
        // Вызов API для обновления стран
        // Обновление локального состояния
      }
    }}>
      {children}
    </SocialContext.Provider>
  );
};