import { items, itemsById } from '../loaders/items.js';

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const getItems = () => items;
export const getGems = () => items.filter(item => item.category === 'Gem');
export const getMinerals = () => items.filter(item => item.category === 'Mineral');
export const getItemsByCategory = (category) => items.filter(item => item.category === category);
export const getItemById = (id) => itemsById[id];
export const getItemsByRarity = (rarity) => items.filter(item => item.rarity === rarity);
export const getItemCount = () => items.length;
export const getProcessableItems = (processType) => {
  return getItems().filter(item => 
    item.processing && item.processing[`can${capitalize(processType)}`]
  );
};