/**
 * Inventory manipulation helpers
 * Uses new schema: rawMaterials (stackable) and processedMaterials (not stackable)
 */

import { getItemById } from '../data/items.js';

/**
 * Determines the category for an item based on items.yaml
 */
function getItemCategory(itemId) {
  const item = getItemById(itemId);
  return item?.category || 'Unknown';
}

/**
 * Adds raw material (ore, mineral) to inventory - stacks by id
 */
export function addRawMaterial(inventory, itemId, quantity = 1) {
  const rawMaterials = [...(inventory.rawMaterials || [])];
  const category = getItemCategory(itemId);
  
  // Find existing entry with same id and category
  const existingIndex = rawMaterials.findIndex(m => m.id === itemId && m.category === category);
  
  if (existingIndex >= 0) {
    rawMaterials[existingIndex] = {
      ...rawMaterials[existingIndex],
      quantity: rawMaterials[existingIndex].quantity + quantity
    };
  } else {
    rawMaterials.push({ id: itemId, category, quantity });
  }
  
  return { ...inventory, rawMaterials };
}

/**
 * Removes raw material from inventory
 */
export function removeRawMaterial(inventory, itemId, quantity = 1) {
  const rawMaterials = [...(inventory.rawMaterials || [])];
  const idx = rawMaterials.findIndex(m => m.id === itemId);
  
  if (idx >= 0) {
    const newQty = rawMaterials[idx].quantity - quantity;
    if (newQty <= 0) {
      rawMaterials.splice(idx, 1);
    } else {
      rawMaterials[idx] = { ...rawMaterials[idx], quantity: newQty };
    }
  }
  
  return { ...inventory, rawMaterials };
}

/**
 * Adds processed material (cut gem, refined metal) to inventory - no stacking
 */
export function addProcessedMaterial(inventory, itemId, category, quality, value) {
  const processedMaterials = [...(inventory.processedMaterials || [])];
  
  processedMaterials.push({
    id: itemId,
    category, // 'Gem' or 'Metal'
    quality,
    value
  });
  
  return { ...inventory, processedMaterials };
}

/**
 * Removes processed material from inventory by id (removes one instance)
 */
export function removeProcessedMaterial(inventory, itemId) {
  const processedMaterials = [...(inventory.processedMaterials || [])];
  const idx = processedMaterials.findIndex(m => m.id === itemId);
  
  if (idx >= 0) {
    processedMaterials.splice(idx, 1);
  }
  
  return { ...inventory, processedMaterials };
}

/**
 * Legacy helpers - map old API to new schema
 */
export function addItemToInventory(inventory, itemId, quantity = 1, quality = null) {
  if (quality === null) {
    // Raw material
    return addRawMaterial(inventory, itemId, quantity);
  } else {
    // Processed material
    const category = getItemCategory(itemId);
    const item = getItemById(itemId);
    const value = Math.round((item?.value || 10) * (quality / 100));
    return addProcessedMaterial(inventory, itemId, category, quality, value);
  }
}

export function removeItemFromInventory(inventory, itemId) {
  // Try raw materials first
  let raw = removeRawMaterial(inventory, itemId, 1);
  if (raw.rawMaterials !== inventory.rawMaterials) {
    return raw;
  }
  
  // Try processed materials
  return removeProcessedMaterial(inventory, itemId);
}

export function addOreToInventory(inventory, oreId, quantity = 1) {
  return addRawMaterial(inventory, oreId, quantity);
}

export function removeOreFromInventory(inventory, oreId) {
  return removeRawMaterial(inventory, oreId, 1);
}

export function addMetalToInventory(inventory, metalId, quantity = 1, quality = null) {
  if (quality === null) {
    return addRawMaterial(inventory, metalId, quantity);
  }
  const item = getItemById(metalId);
  const value = Math.round((item?.value || 10) * (quality / 100));
  return addProcessedMaterial(inventory, metalId, 'Metal', quality, value);
}

export function removeMetalFromInventory(inventory, metalId) {
  return removeProcessedMaterial(inventory, metalId);
}