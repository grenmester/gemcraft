/**
 * Inventory manipulation helpers
 *
 * These helpers handle the dual property naming for minerals (id) and gems (gemId).
 * Minerals use `id` property, gems use `gemId` property. This reflects the
 * intentional distinction between the two inventory categories.
 * 
 * Metals also use `id` property (like minerals) and stack by quality.
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
 * Determines if an item is a metal based on items.json data
 * @param {string} itemId - The ID of the item
 * @returns {boolean} True if the item is a metal
 */
function isMetal(itemId) {
  const item = getItemById(itemId);
  return item?.category === 'Metal';
}

/**
 * Determines if an item is an ore based on items.json data
 * @param {string} itemId - The ID of the item
 * @returns {boolean} True if the item is an ore
 */
function isOre(itemId) {
  const item = getItemById(itemId);
  return item?.category === 'Ore';
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

  // Prefer removing from unprocessed items (no quality) first, then lowest quality
  const mineralIndex = minerals.findIndex(m => m.id === itemId && m.quality === undefined);
  const fallbackMineralIndex = minerals.findIndex(m => m.id === itemId);
  const actualMineralIndex = mineralIndex >= 0 ? mineralIndex : fallbackMineralIndex;
  
  if (actualMineralIndex >= 0) {
    const mineral = minerals[actualMineralIndex];
    const newQty = mineral.quantity - 1;
    if (newQty <= 0) {
      minerals.splice(actualMineralIndex, 1);
    } else {
      minerals[actualMineralIndex] = { ...mineral, quantity: newQty };
    }
    return { minerals, gems, removed: true };
  }

  const gemIndex = gems.findIndex(g => g.gemId === itemId && g.quality === undefined);
  const fallbackGemIndex = gems.findIndex(g => g.gemId === itemId);
  const actualGemIndex = gemIndex >= 0 ? gemIndex : fallbackGemIndex;
  
  if (actualGemIndex >= 0) {
    const gem = gems[actualGemIndex];
    const newQty = gem.quantity - 1;
    if (newQty <= 0) {
      gems.splice(actualGemIndex, 1);
    } else {
      gems[actualGemIndex] = { ...gem, quantity: newQty };
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
 * @param {number} [quality] - Quality value (0-100) to store with the item. 
 *                             Items with different qualities stack separately.
 * @returns {Object} { minerals, gems } - Updated arrays
 */
export function addItemToInventory(inventory, itemId, quantity = 1, quality = null) {
  const minerals = [...(inventory.minerals || [])];
  const gems = [...(inventory.gems || [])];

  // Stack items only with items that have the same quality level
  // Round quality to nearest 5 for grouping (e.g., 67%, 68%, 69% all become 65%)
  const roundedQuality = quality !== null ? Math.round(quality / 5) * 5 : null;

  const mineralIndex = minerals.findIndex(m => m.id === itemId && 
    (roundedQuality === null ? m.quality === undefined : Math.round((m.quality || 0) / 5) * 5 === roundedQuality));
  if (mineralIndex >= 0) {
    const mineral = minerals[mineralIndex];
    minerals[mineralIndex] = { 
      ...mineral, 
      quantity: mineral.quantity + quantity,
      ...(quality !== null && { quality })
    };
    return { minerals, gems };
  }

  const gemIndex = gems.findIndex(g => g.gemId === itemId && 
    (roundedQuality === null ? g.quality === undefined : Math.round((g.quality || 0) / 5) * 5 === roundedQuality));
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

/**
 * Adds metal to inventory
 * @param {Object} inventory - The inventory object with metals array
 * @param {string} metalId - The ID of the metal to add
 * @param {number} [quantity=1] - Number of metal units to add
 * @param {number} [quality] - Quality value (0-100) to store with the metal
 * @returns {Object} Updated inventory with metals array
 */
export function addMetalToInventory(inventory, metalId, quantity = 1, quality = null) {
  const metals = [...(inventory.metals || [])];
  
  // Stack metals only with items that have the same quality level
  const roundedQuality = quality !== null ? Math.round(quality / 5) * 5 : null;
  
  const metalIndex = metals.findIndex(m => m.id === metalId && 
    (roundedQuality === null ? m.quality === undefined : Math.round((m.quality || 0) / 5) * 5 === roundedQuality));
  
  if (metalIndex >= 0) {
    const metal = metals[metalIndex];
    metals[metalIndex] = { 
      ...metal, 
      quantity: metal.quantity + quantity,
      ...(quality !== null && { quality })
    };
    return { metals };
  }
  
  // Add new metal entry
  metals.push({ id: metalId, quantity, ...(quality !== null && { quality }) });
  return { metals };
}

/**
 * Removes one unit of metal from inventory
 * @param {Object} inventory - The inventory object with metals array
 * @param {string} metalId - The ID of the metal to remove
 * @returns {Object} { metals, removed } - Updated metals array and removal status
 */
export function removeMetalFromInventory(inventory, metalId) {
  const metals = [...(inventory.metals || [])];
  
  const metalIndex = metals.findIndex(m => m.id === metalId);
  
  if (metalIndex >= 0) {
    const metal = metals[metalIndex];
    const newQty = metal.quantity - 1;
    if (newQty <= 0) {
      metals.splice(metalIndex, 1);
    } else {
      metals[metalIndex] = { ...metal, quantity: newQty };
    }
    return { metals, removed: true };
  }
  
  return { metals, removed: false };
}

/**
 * Removes one unit of ore from inventory (for refining)
 * @param {Object} inventory - The inventory object with ores array
 * @param {string} oreId - The ID of the ore to remove
 * @returns {Object} { ores, removed } - Updated ores array and removal status
 */
export function removeOreFromInventory(inventory, oreId) {
  const ores = [...(inventory.ores || [])];
  
  const oreIndex = ores.findIndex(o => o.id === oreId);
  
  if (oreIndex >= 0) {
    const ore = ores[oreIndex];
    const newQty = ore.quantity - 1;
    if (newQty <= 0) {
      ores.splice(oreIndex, 1);
    } else {
      ores[oreIndex] = { ...ore, quantity: newQty };
    }
    return { ores, removed: true };
  }
  
  return { ores, removed: false };
}

/**
 * Adds ore to inventory
 * @param {Object} inventory - The inventory object with ores array
 * @param {string} oreId - The ID of the ore to add
 * @param {number} [quantity=1] - Number of ore units to add
 * @returns {Object} Updated inventory with ores array
 */
export function addOreToInventory(inventory, oreId, quantity = 1) {
  const ores = [...(inventory.ores || [])];
  
  const oreIndex = ores.findIndex(o => o.id === oreId);
  
  if (oreIndex >= 0) {
    const ore = ores[oreIndex];
    ores[oreIndex] = { 
      ...ore, 
      quantity: ore.quantity + quantity
    };
    return { ores };
  }
  
  // Add new ore entry
  ores.push({ id: oreId, quantity });
  return { ores };
}
