import React from 'react';
import { useGameContext } from '../contexts/GameContext';
import { useStoreContext } from '../contexts/StoreContext';

const Header = () => {
  const { user } = useGameContext();
  const { openStore } = useStoreContext();
  
  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <div className="bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center mr-3">
          <span className="text-xl">🎮</span>
        </div>
        <h1 className="text-xl font-bold">Ball Game</h1>
      </div>
      
      <div className="flex space-x-4">
        <button 
          onClick={openStore}
          className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded-lg flex items-center"
        >
          <span className="mr-2">🛒</span>
          <span>Магазин</span>
        </button>
        
        <div className="bg-blue-600 px-3 py-1 rounded-lg flex items-center">
          <span className="mr-2">💰</span>
          <span>{user.currency}</span>
        </div>
        <div className="bg-purple-600 px-3 py-1 rounded-lg flex items-center">
          <span className="mr-2">🏆</span>
          <span>{user.ratingPoints}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;