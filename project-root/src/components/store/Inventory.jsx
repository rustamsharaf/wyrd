import React from 'react';
import { useStoreContext } from '../../contexts/StoreContext';
import { useGameContext } from '../../contexts/GameContext';

const Inventory = () => {
  const { inventory, activateItem } = useStoreContext();
  const { user } = useGameContext();
  
  const categories = [
    { id: 'backgrounds', name: 'Фоны', icon: '🎨' },
    { id: 'effects', name: 'Эффекты', icon: '✨' },
    { id: 'frames', name: 'Рамки', icon: '🖼️' },
    { id: 'bonuses', name: 'Бонусы', icon: '🎁' }
  ];
  
  const getCategoryItems = (category) => {
    return inventory.filter(item => item.item?.category === category);
  };
  
  const canActivate = (item) => {
    // Предметы с ограниченным сроком действия можно активировать только когда они не активны
    if (item.expiresAt && item.isActive) return false;
    
    // Вечные предметы можно активировать/деактивировать
    return true;
  };
  
  const formatExpiration = (expiresAt) => {
    if (!expiresAt) return 'Вечный';
    
    const now = new Date();
    const diffMs = expiresAt - now;
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins <= 0) return 'Истек';
    
    if (diffMins < 60) return `${diffMins} мин`;
    
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${diffHours} ч ${remainingMins} мин`;
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="mr-2">🎒</span> Ваш инвентарь
        </h2>
      </div>
      
      <div className="p-4 max-h-96 overflow-y-auto">
        {inventory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Ваш инвентарь пуст. Посетите магазин!
          </div>
        ) : (
          categories.map(category => {
            const items = getCategoryItems(category.id);
            if (items.length === 0) return null;
            
            return (
              <div key={category.id} className="mb-6">
                <h3 className="font-bold text-lg mb-3 flex items-center">
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map(item => (
                    <div 
                      key={item._id} 
                      className={`p-3 rounded-lg flex items-center ${
                        item.isActive ? 'bg-green-900 bg-opacity-30' : 'bg-gray-700'
                      }`}
                    >
                      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mr-3">
                        <img 
                          src={item.item.iconUrl} 
                          alt={item.item.name} 
                          className="max-h-8 max-w-8"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.item.name}</div>
                        {item.expiresAt && (
                          <div className="text-xs text-gray-400">
                            {item.isActive ? 'Активен: ' : ''}
                            {formatExpiration(item.expiresAt)}
                          </div>
                        )}
                      </div>
                      
                      {canActivate(item) && (
                        <button
                          onClick={() => activateItem(item._id)}
                          className={`px-3 py-1 rounded text-sm ${
                            item.isActive 
                              ? 'bg-gray-600 hover:bg-gray-500' 
                              : 'bg-blue-600 hover:bg-blue-500'
                          }`}
                        >
                          {item.isActive ? 'Деактивировать' : 'Активировать'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Inventory;