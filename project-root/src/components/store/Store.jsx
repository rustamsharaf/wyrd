import React, { useState, useEffect } from 'react';
import { useStoreContext } from '../../contexts/StoreContext';
import { useGameContext } from '../../contexts/GameContext';

const Store = () => {
  const { 
    storeItems, 
    activeCategory, 
    setActiveCategory, 
    isStoreOpen, 
    closeStore, 
    buyItem,
    purchaseStatus
  } = useStoreContext();
  
  const { user } = useGameContext();
  const [categoryItems, setCategoryItems] = useState([]);
  const [isBuying, setIsBuying] = useState(false);

  // Фильтрация товаров по активной категории
  useEffect(() => {
    if (storeItems[activeCategory]) {
      setCategoryItems(storeItems[activeCategory]);
    } else {
      setCategoryItems([]);
    }
  }, [storeItems, activeCategory]);

  // Обработка покупки
  const handleBuy = async (itemId) => {
    setIsBuying(true);
    await buyItem(itemId);
    setIsBuying(false);
  };

  if (!isStoreOpen) return null;

  const categories = [
    { id: 'backgrounds', name: 'Фоны', icon: '🎨' },
    { id: 'effects', name: 'Эффекты', icon: '✨' },
    { id: 'frames', name: 'Рамки', icon: '🖼️' },
    { id: 'bonuses', name: 'Бонусы', icon: '🎁' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Магазин</h2>
          <button 
            onClick={closeStore}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>
        
        {/* Вкладки категорий */}
        <div className="flex border-b border-gray-700">
          {categories.map(category => (
            <button
              key={category.id}
              className={`flex-1 py-3 px-4 text-center font-medium flex items-center justify-center ${
                activeCategory === category.id 
                  ? 'bg-gray-700 text-blue-400' 
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
        
        {/* Статус покупки */}
        {purchaseStatus && (
          <div className={`p-3 ${
            purchaseStatus.success ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
          }`}>
            {purchaseStatus.message}
          </div>
        )}
        
        {/* Товары */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categoryItems.length > 0 ? (
            categoryItems.map(item => (
              <div 
                key={item._id} 
                className="bg-gray-700 rounded-lg overflow-hidden border border-gray-600"
              >
                <div className="p-4 bg-gray-800 flex items-center justify-center h-32">
                  <img 
                    src={item.iconUrl} 
                    alt={item.name} 
                    className="max-h-20 max-w-full"
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-white">{item.name}</h3>
                  <p className="text-sm text-gray-300 mt-1 min-h-[40px]">{item.description}</p>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-yellow-400 font-bold">{item.price}</span>
                      <span className="ml-1">💰</span>
                    </div>
                    
                    {item.ratingRequired > 0 && (
                      <div className="flex items-center text-sm">
                        <span>Рейтинг:</span>
                        <span className="ml-1 font-bold">{item.ratingRequired}</span>
                        <span className="ml-1">🏆</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleBuy(item._id)}
                    disabled={isBuying || user.currency < item.price || user.ratingPoints < item.ratingRequired}
                    className={`w-full mt-3 py-2 rounded-lg font-medium transition ${
                      user.currency >= item.price && user.ratingPoints >= item.ratingRequired
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isBuying ? 'Покупка...' : 'Купить'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              В этой категории пока нет доступных товаров
            </div>
          )}
        </div>
        
        {/* Баланс пользователя */}
        <div className="p-4 border-t border-gray-700 flex justify-between items-center bg-gray-900">
          <div className="flex items-center">
            <span className="mr-2">Ваш баланс:</span>
            <span className="font-bold text-yellow-400">{user.currency}</span>
            <span className="ml-1">💰</span>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2">Ваш рейтинг:</span>
            <span className="font-bold text-purple-400">{user.ratingPoints}</span>
            <span className="ml-1">🏆</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Store;