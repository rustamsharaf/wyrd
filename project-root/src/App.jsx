// src/App.jsx
import React from 'react';
import { GameProvider } from './contexts/GameContext';
import { SocialProvider } from './contexts/SocialContext';
import Header from './components/Header';
import VideoStream from './components/VideoStream';
import BetPanel from './components/BetPanel';
import CountdownTimer from './components/CountdownTimer';
import GuidesPanel from './components/social/GuidesPanel';
import CountryChat from './components/social/CountryChat';

function App() {
  return (
    <GameProvider>
      <SocialProvider>
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
          <Header />
          
          <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">
            <div className="mb-6">
              <VideoStream />
            </div>
            
            <CountdownTimer />
            
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <GuidesPanel />
              </div>
              <div>
                <CountryChat />
              </div>
            </div>
            
            <div className="mt-6">
              <BetPanel />
            </div>
          </main>
          
          <footer className="py-4 text-center text-gray-500 text-sm">
            Ball Game PWA © {new Date().getFullYear()}
          </footer>
        </div>
      </SocialProvider>
    </GameProvider>
  );
}

export default App;