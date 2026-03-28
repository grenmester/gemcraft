import { useState, useCallback } from 'react';

const registeredMinigames = new Map();

export const registerMinigame = (type, config) => {
  registeredMinigames.set(type, config);
};

export const getMinigame = (type) => {
  return registeredMinigames.get(type);
};

export const getAllMinigames = () => {
  return Array.from(registeredMinigames.values());
};

export function useMinigameRegistry() {
  const [activeMinigame, setActiveMinigame] = useState(null);

  const startMinigame = useCallback((type) => {
    const minigame = getMinigame(type);
    if (minigame) {
      setActiveMinigame(minigame);
    }
  }, []);

  const endMinigame = useCallback(() => {
    setActiveMinigame(null);
  }, []);

  return {
    activeMinigame,
    startMinigame,
    endMinigame,
    getMinigame,
    getAllMinigames,
  };
}
