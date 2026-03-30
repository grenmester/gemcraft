import { z } from 'zod';

export const equipmentEffectSchema = z.object({
  dropRateBonus: z.number().min(0).max(1),
  extraItems: z.number().int().min(0)
});

export const equipmentCostSchema = z.object({
  coins: z.number().min(0),
  unlockLevel: z.number().int().min(0)
});

export const equipmentCraftRecipeSchema = z.object({
  materials: z.record(z.string(), z.number()),
  coins: z.number().min(0)
}).nullable();

export const equipmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  cost: z.number().min(0),
  unlockLevel: z.number().int().min(0),
  effect: equipmentEffectSchema,
  unlocks: z.array(z.string()),
  description: z.string(),
  craftRecipe: equipmentCraftRecipeSchema
});

export const equipmentDataSchema = z.record(z.string(), equipmentSchema);
