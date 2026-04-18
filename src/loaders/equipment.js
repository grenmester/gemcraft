import { load } from 'js-yaml';
import { equipmentDataSchema } from '../schemas/equipment.js';

const yamlModules = import.meta.glob('../data/equipment.yaml', { query: '?raw', import: 'default', eager: true });

function loadYaml(rawYaml) {
  const data = load(rawYaml);
  const result = equipmentDataSchema.safeParse(data);
  if (!result.success) {
    console.error('❌ Invalid equipment.yaml:', result.error.format());
    throw new Error(`equipment.yaml validation failed: ${result.error.message}`);
  }
  return result.data;
}

const rawYaml = Object.values(yamlModules)[0];
export const equipmentData = loadYaml(rawYaml);
export const EQUIPMENT = equipmentData;

export const getEquipmentById = (id) => EQUIPMENT[id];

export const getOwnedEquipment = (level, ownedIds = []) => {
  return Object.values(EQUIPMENT).filter(eq =>
    eq.unlockLevel <= level &&
    (eq.id === 'NONE' || ownedIds.includes(eq.id))
  );
};

export const canAffordEquipment = (coins, equipmentId) => {
  const eq = EQUIPMENT[equipmentId];
  return coins >= eq.cost;
};

export const canCraftEquipment = (inventory, equipmentId) => {
  const eq = EQUIPMENT[equipmentId];
  if (!eq.craftRecipe) return false;

  const rawMaterials = inventory.rawMaterials || [];
  for (const [materialId, required] of Object.entries(eq.craftRecipe.materials)) {
    const owned = rawMaterials.find(m => m.id === materialId)?.quantity || 0;
    if (owned < required) return false;
  }

  return (inventory.coins || 0) >= eq.craftRecipe.coins;
};

export const getEquipmentForZone = (zoneId) => {
  return Object.values(EQUIPMENT).filter(eq => eq.unlocks.includes(zoneId));
};
