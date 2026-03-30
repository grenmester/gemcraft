import { useGame, ADD_TO_INVENTORY, REMOVE_FROM_INVENTORY, ADD_GEM } from '../../../context/GameContext';

export function useInventory() {
  const { state, dispatch } = useGame();

  const inventory = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
  const gemdex = state.player.gemdex || [];

  const addToInventory = (category, gemId, quantity = 1) => {
    dispatch({ type: ADD_TO_INVENTORY, payload: { category, gemId, quantity } });
  };

  const removeFromInventory = (category, gemId, quantity = 1) => {
    dispatch({ type: REMOVE_FROM_INVENTORY, payload: { category, gemId, quantity } });
  };

  const addGem = (gem) => {
    dispatch({ type: ADD_GEM, payload: gem });
  };

  const getInventoryItems = (category) => {
    return inventory[category] || [];
  };

  const getItemQuantity = (category, gemId) => {
    const items = inventory[category] || [];
    const item = items.find(i => i.gemId === gemId);
    return item?.quantity || 0;
  };

  const isGemDiscovered = (gemId) => {
    return gemdex.some(g => g.id === gemId);
  };

  return {
    inventory,
    gemdex,
    coins: state.player.coins,
    addToInventory,
    removeFromInventory,
    addGem,
    getInventoryItems,
    getItemQuantity,
    isGemDiscovered,
  };
}
