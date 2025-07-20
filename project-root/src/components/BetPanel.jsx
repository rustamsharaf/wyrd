import React, { useState, useEffect } from 'react';
import { useGameContext } from '../contexts/GameContext';

const BetPanel = () => {
  const { user, isBetPanelOpen, toggleBetPanel, placeBet } = useGameContext();
  const [selectedBall, setSelectedBall] = useState('0');
  const [betAmount, setBetAmount] = useState(10);
  const [balls, setBalls] = useState([]);
  
  // Инициализация шаров
  useEffect(() => {
    const ballOptions = [];
    for (let i = 0; i < 10; i++) {
      ballOptions.push(i.toString());
    }
    ballOptions.push('joker');
    setBalls(ballOptions);
  }, []);
  
  if (!isBetPanelOpen) return null;
  
  const handlePlaceBet = (e) => {
    e.preventDefault();
    placeBet(selectedBall, betAmount);
    toggleBetPanel();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 relative">
        <button 
          onClick={toggleBetPanel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        
        <h2 className="text-xl font-bold text-white mb-4">Place Your Bet</h2>
        
        <div className="mb-6">
          <h3 className="text-gray-300 mb-2">Select Ball:</h3>
          <div className="grid grid-cols-4 gap-3">
            {balls.map(ball => (
              <button
                key={ball}
                className={`h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all
                  ${selectedBall === ball 
                    ? 'bg-purple-600 text-white transform scale-110' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                onClick={() => setSelectedBall(ball)}
              >
                {ball === 'joker' ? '🃏' : ball}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-gray-300 mb-2">Bet Amount:</h3>
          <div className="flex items-center">
            <button 
              className="bg-gray-700 w-10 h-10 rounded-l-lg text-gray-300 hover:bg-gray-600"
              onClick={() => setBetAmount(Math.max(1, betAmount - 10))}
            >
              -
            </button>
            
            <div className="flex-1 bg-gray-900 h-10 flex items-center justify-center">
              <span className="text-white font-bold">{betAmount}</span>
            </div>
            
            <button 
              className="bg-gray-700 w-10 h-10 rounded-r-lg text-gray-300 hover:bg-gray-600"
              onClick={() => setBetAmount(Math.min(user.currency, betAmount + 10))}
            >
              +
            </button>
          </div>
          <div className="flex justify-between mt-1 text-sm text-gray-400">
            <span>Min: 1</span>
            <span>Max: {user.currency}</span>
          </div>
        </div>
        
        <button
          onClick={handlePlaceBet}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
          disabled={betAmount > user.currency}
        >
          Place Bet ({betAmount} 💰)
        </button>
      </div>
    </div>
  );
};

export default BetPanel;