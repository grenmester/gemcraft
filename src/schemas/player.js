import { z } from 'zod';

export const MaterialCategoryEnum = z.enum(['Gem', 'Mineral', 'Ore', 'Metal']);

export const ProcessedMaterialSchema = z.object({
  id: z.string(),
  category: MaterialCategoryEnum,
  quality: z.number().min(0).max(100),
  value: z.number().min(0),
});

export const RawMaterialSchema = z.object({
  id: z.string(),
  category: MaterialCategoryEnum,
  quantity: z.number().min(1),
});

export const JewelrySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  gemIds: z.array(z.string()),
  metalId: z.string(),
  setting: z.string(),
  quality: z.number().min(0).max(100),
  value: z.number().min(0),
  craftedAt: z.number(),
});

export const EquipmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  cost: z.number().min(0),
  unlockLevel: z.number().int().min(0),
  owned: z.boolean(),
});

export const ProcessEquipmentSchema = z.object({
  id: z.string(),
  owned: z.boolean(),
  level: z.number().int().min(1).default(1),
});

export const InventorySchema = z.object({
  rawMaterials: z.array(RawMaterialSchema).default([]),
  processedMaterials: z.array(ProcessedMaterialSchema).default([]),
  jewelry: z.array(JewelrySchema).default([]),
  equipment: z.array(EquipmentSchema).default([]),
  processEquipment: z.array(ProcessEquipmentSchema).default([]),
  coins: z.number().min(0).default(100),
});

export const PlayerSchema = z.object({
  name: z.string().default('Explorer'),
  level: z.number().int().min(1).default(1),
  xp: z.number().min(0).default(0),
  shiftPoints: z.number().int().min(0).default(0),
  craftingXP: z.number().min(0).default(0),
  inventory: InventorySchema.default(),
  discoveredGems: z.array(z.string()).default([]),
  newDiscoveredGems: z.array(z.string()).default([]),
  locationProgress: z.record(z.string(), z.number()).default({}),
  highScores: z.record(z.string(), z.number()).default({}),
});

export const GameStateSchema = z.object({
  phase: z.string(),
  player: PlayerSchema,
  discoverState: z.record(z.string(), z.any()).default({}),
  processState: z.record(z.string(), z.any()).default({}),
});

export function createInitialInventory() {
  return {
    rawMaterials: [],
    processedMaterials: [],
    jewelry: [],
    equipment: [],
    processEquipment: [],
    coins: 100,
  };
}

export function createInitialPlayer() {
  return {
    name: 'Explorer',
    level: 1,
    xp: 0,
    shiftPoints: 0,
    craftingXP: 0,
    inventory: createInitialInventory(),
    discoveredGems: [],
    newDiscoveredGems: [],
    locationProgress: {},
    highScores: {},
  };
}