/**
 * Inventory manipulation helpers
 *
 * These helpers handle the dual property naming for minerals (id) and gems (gemId).
 * Minerals use `id` property, gems use `gemId` property. This reflects the
 * intentional distinction between the two inventory categories.
 */

import { getItemById } from '../data/items.js';

/**
 * Determines if an item is a mineral based on items.json data
 * @param {string} itemId - The ID of the item
 * @returns {boolean} True if the item is a mineral
 */
function isMineral(itemId) {
  const item = getItemById(itemId);
  return item?.category === 'Mineral';
}

/**
 * Removes one unit of an item from inventory
 * @param {Object} inventory - The inventory object with minerals, gems arrays
 * @param {string} itemId - The ID of the item to remove
 * @returns {Object} { minerals, gems, removed } - Updated arrays and removal status
 */
export function removeItemFromInventory(inventory, itemId) {
  const minerals = [...(inventory.minerals || [])];
  const gems = [...(inventory.gems || [])];

  const mineralIndex = minerals.findIndex(m => m.id === itemId);
  if (mineralIndex >= 0) {
    const mineral = minerals[mineralIndex];
    const newQty = mineral.quantity - 1;
    if (newQty <= 0) {
      minerals.splice(mineralIndex, 1);
    } else {
      minerals[mineralIndex] = { ...mineral, quantity: newQty };
    }
    return { minerals, gems, removed: true };
  }

  const gemIndex = gems.findIndex(g => g.gemId === itemId);
  if (gemIndex >= 0) {
    const gem = gems[gemIndex];
    const newQty = gem.quantity - 1;
    if (newQty <= 0) {
      gems.splice(gemIndex, 1);
    } else {
      gems[gemIndex] = { ...gem, quantity: newQty };
    }
    return { minerals, gems, removed: true };
  }

  return { minerals, gems, removed: false };
}

/**
 * Adds one unit of an item to inventory
 * @param {Object} inventory - The inventory object with minerals, gems arrays
 * @param {string} itemId - The ID of the item to add
 * @param {number} [quantity=1] - Number of items to add
 * @param {number} [quality] - Quality value (0-100) to store with the item
 * @returns {Object} { minerals, gems } - Updated arrays
 */
export function addItemToInventory(inventory, itemId, quantity = 1, quality = null) {
  const minerals = [...(inventory.minerals || [])];
  const gems = [...(inventory.gems || [])];

  const mineralIndex = minerals.findIndex(m => m.id === itemId);
  if (mineralIndex >= 0) {
    const mineral = minerals[mineralIndex];
    minerals[mineralIndex] = { 
      ...mineral, 
      quantity: mineral.quantity + quantity,
      ...(quality !== null && { quality })
    };
    return { minerals, gems };
  }

  const gemIndex = gems.findIndex(g => g.gemId === itemId);
  if (gemIndex >= 0) {
    const gem = gems[gemIndex];
    gems[gemIndex] = { 
      ...gem, 
      quantity: gem.quantity + quantity,
      ...(quality !== null && { quality })
    };
    return { minerals, gems };
  }

  // Determine correct array based on item category
  if (isMineral(itemId)) {
    minerals.push({ id: itemId, quantity, ...(quality !== null && { quality }) });
  } else {
    gems.push({ gemId: itemId, quantity, ...(quality !== null && { quality }) });
  }
  return { minerals, gems };
}
