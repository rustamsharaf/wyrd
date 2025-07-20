import React from 'react';
import { GameProvider } from './contexts/GameContext';
import Header from './components/Header';
import VideoStream from './components/VideoStream';
import BetPanel from './components/BetPanel';
import CountdownTimer from './components/CountdownTimer';

function App() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">
          <div className="mb-6">
            <VideoStream />
          </div>
          
          <CountdownTimer />
          
          <div className="mt-8 grid grid-cols-2 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">
              My Bets
            </button>
            <button 
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition"
              onClick={() => {}}
            >
              Leaderboard
            </button>
          </div>
          
          <div className="mt-6">
            <button 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-lg transition"
              onClick={() => {}}
            >
              Place Bet
            </button>
          </div>
        </main>
        
        <BetPanel />
        
        <footer className="py-4 text-center text-gray-500 text-sm">
          Ball Game PWA © {new Date().getFullYear()}
        </footer>
      </div>
    </GameProvider>
  );
}

export default App;