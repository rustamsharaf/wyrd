import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';

const GameContext = createContext();

export const useGameContext = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState({ currency: 1000, rating: 50 });
  const [roundStatus, setRoundStatus] = useState({ timeLeft: 30, status: 'betting' });
  const [betDistribution, setBetDistribution] = useState({});
  const [isBetPanelOpen, setIsBetPanelOpen] = useState(false);
  const [winningBall, setWinningBall] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Подключение к WebSocket серверу
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL, {
      auth: {
        token: localStorage.getItem('token') // JWT токен для аутентификации
      }
    });
    
    setSocket(newSocket);

    // Обработчики событий
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('balanceUpdate', (data) => {
      setUser(prev => ({ ...prev, currency: data.currency, rating: data.rating || prev.rating }));
    });

    newSocket.on('newRound', (data) => {
      setRoundStatus({ timeLeft: Math.floor((new Date(data.endTime) - new Date()) / 1000), status: 'betting' });
      setBetDistribution({});
      setWinningBall(null);
    });

    newSocket.on('betUpdate', (data) => {
      setBetDistribution(data.betsDistribution);
    });

    newSocket.on('roundResult', (data) => {
      setWinningBall(data.winningBall);
      setRoundStatus({ timeLeft: 15, status: 'result' });
    });

    newSocket.on('leaderboardUpdate', (data) => {
      setLeaderboard(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Функция для размещения ставки
  const placeBet = (ball, amount) => {
    if (socket && amount <= user.currency) {
      socket.emit('placeBet', { ballNumber: ball, amount });
    }
  };

  // Функция для открытия/закрытия панели ставок
  const toggleBetPanel = () => {
    setIsBetPanelOpen(!isBetPanelOpen);
  };

  return (
    <GameContext.Provider value={{
      user,
      roundStatus,
      betDistribution,
      winningBall,
      leaderboard,
      isBetPanelOpen,
      toggleBetPanel,
      placeBet
    }}>
      {children}
    </GameContext.Provider>
  );
};