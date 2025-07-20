import React, { useState, useEffect } from 'react';
import { useGameContext } from '../contexts/GameContext';

const CountdownTimer = () => {
  const { roundStatus } = useGameContext();
  const [timeLeft, setTimeLeft] = useState(roundStatus.timeLeft);
  
  useEffect(() => {
    setTimeLeft(roundStatus.timeLeft);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [roundStatus]);
  
  const getStatusColor = () => {
    switch(roundStatus.status) {
      case 'betting': return 'bg-blue-600';
      case 'result': return 'bg-green-600';
      case 'break': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };
  
  const getStatusText = () => {
    switch(roundStatus.status) {
      case 'betting': return 'BETTING';
      case 'result': return 'RESULT';
      case 'break': return 'BREAK';
      default: return 'WAITING';
    }
  };
  
  return (
    <div className="mt-6">
      <div className={`${getStatusColor()} text-white font-bold py-2 px-4 rounded-t-lg flex justify-between`}>
        <span>{getStatusText()}</span>
        <span>{timeLeft}s</span>
      </div>
      
      <div className="bg-gray-800 rounded-b-lg p-4">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getStatusColor()} transition-all`}
            style={{ width: `${(timeLeft / roundStatus.timeLeft) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;