import itemsData from './items.json';

export const getItems = () => itemsData.items;
export const getGems = () => itemsData.items.filter(item => item.category === 'Gem');
export const getMinerals = () => itemsData.items.filter(item => item.category === 'Mineral');
export const getItemsByCategory = (category) => itemsData.items.filter(item => item.category === category);
export const getItemById = (id) => itemsData.items.find(item => item.id === id);
export const getItemsByRarity = (rarity) => itemsData.items.filter(item => item.rarity === rarity);
export const getItemCount = () => itemsData.items.length;