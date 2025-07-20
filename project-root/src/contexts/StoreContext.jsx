import React, { createContext, useState, useEffect, useContext } from 'react';
import { useGameContext } from './GameContext';

const StoreContext = createContext();

export const useStoreContext = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const { user } = useGameContext();
  const [storeItems, setStoreItems] = useState({});
  const [inventory, setInventory] = useState([]);
  const [activeCategory, setActiveCategory] = useState('backgrounds');
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState(null);

  // Загрузка товаров магазина
  const loadStoreItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store/items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setStoreItems(data);
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err);
    }
  };

  // Загрузка инвентаря
  const loadInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setInventory(data);
    } catch (err) {
      console.error('Ошибка загрузки инвентаря:', err);
    }
  };

  // Покупка товара
  const buyItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store/buy/${itemId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPurchaseStatus({ success: true, message: 'Покупка успешна!' });
        loadInventory();
        return true;
      } else {
        setPurchaseStatus({ success: false, message: result.message });
        return false;
      }
    } catch (err) {
      setPurchaseStatus({ success: false, message: 'Ошибка сервера' });
      console.error('Ошибка покупки:', err);
      return false;
    }
  };

  // Активация предмета
  const activateItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store/activate/${itemId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        loadInventory();
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error('Ошибка активации:', err);
      return false;
    }
  };

  // Открытие магазина
  const openStore = () => {
    setIsStoreOpen(true);
    loadStoreItems();
    loadInventory();
  };

  // Закрытие магазина
  const closeStore = () => {
    setIsStoreOpen(false);
    setPurchaseStatus(null);
  };

  return (
    <StoreContext.Provider value={{
      storeItems,
      inventory,
      activeCategory,
      setActiveCategory,
      isStoreOpen,
      openStore,
      closeStore,
      buyItem,
      activateItem,
      purchaseStatus
    }}>
      {children}
    </StoreContext.Provider>
  );
};