import React, { useEffect, useRef } from 'react';
import { useGameContext } from '../contexts/GameContext';

const VideoStream = () => {
  const { winningBall, betDistribution } = useGameContext();
  const videoRef = useRef(null);
  
  // Эффект для "видеопотока" (в реальном приложении подключите реальный стрим)
  useEffect(() => {
    // Здесь будет подключение к реальному видеопотоку
    // Для демо используем статическое изображение с анимацией
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 450;
    
    const drawBall = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Рисуем фон
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Рисуем выигрышный шар, если есть
      if (winningBall) {
        const ballSize = 120;
        const x = canvas.width / 2;
        const y = canvas.height / 2;
        
        // Градиент для шара
        const gradient = ctx.createRadialGradient(
          x - ballSize/4, y - ballSize/4, 5,
          x, y, ballSize/2
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, winningBall === 'joker' ? '#9c27b0' : '#2196f3');
        
        ctx.beginPath();
        ctx.arc(x, y, ballSize/2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Текст на шаре
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(winningBall.toUpperCase(), x, y);
      }
      
      // Отображаем на видеоэлементе
      if (videoRef.current) {
        videoRef.current.srcObject = canvas.captureStream();
      }
      
      requestAnimationFrame(drawBall);
    };
    
    drawBall();
  }, [winningBall]);
  
  return (
    <div className="relative w-full h-96 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline
        className="w-full h-full object-cover"
      />
      
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
        <div className="flex overflow-x-auto space-x-1">
          {Object.entries(betDistribution).map(([ball, percent]) => (
            <div key={ball} className="flex flex-col items-center min-w-max px-2">
              <div className="text-white text-sm font-bold">{ball}</div>
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {percent}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoStream;