// src/components/social/CountryChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSocialContext } from '../../contexts/SocialContext';
import { useGameContext } from '../../contexts/GameContext';

const CountryChat = () => {
  const { user } = useGameContext();
  const { 
    countryChats, 
    activeChatCountry, 
    setActiveCountry, 
    sendMessage 
  } = useSocialContext();
  
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [countryChats[activeChatCountry]]);

  // Если нет активной страны, выбираем первую из списка пользователя
  useEffect(() => {
    if (!activeChatCountry && user.countries?.length > 0) {
      setActiveCountry(user.countries[0]);
    }
  }, [user.countries, activeChatCountry, setActiveCountry]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && activeChatCountry) {
      sendMessage(activeChatCountry, message);
      setMessage('');
    }
  };

  if (!user.countries || user.countries.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 text-center">
        <p className="text-gray-400 mb-2">You haven't selected any countries for chat</p>
        <button 
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          onClick={() => {/* Открыть настройки профиля */}}
        >
          Update Profile
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="flex border-b border-gray-700 overflow-x-auto">
        {user.countries.map(country => (
          <button
            key={country}
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${
              activeChatCountry === country 
                ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:bg-gray-700'
            }`}
            onClick={() => setActiveCountry(country)}
          >
            {country} {countryChats[country]?.length > 0 && (
              <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                {countryChats[country].length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="h-64 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 bg-gray-850">
          {activeChatCountry && countryChats[activeChatCountry] ? (
            <>
              {countryChats[activeChatCountry].map(msg => (
                <div key={msg.id} className="mb-3">
                  <div className="flex items-start">
                    <div className="bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center mr-2 flex-shrink-0">
                      <span className="text-sm">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline">
                        <span className="font-medium mr-2">{msg.nickname}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-gray-200">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Loading chat...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-700 p-3">
          <div className="flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message ${activeChatCountry} chat...`}
              className="flex-1 bg-gray-700 text-white rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={200}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r-lg font-medium"
              disabled={!message.trim()}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CountryChat;