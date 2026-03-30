import { z } from 'zod';

export const UPGRADE_CATEGORIES = ['processing', 'discovery', 'storage', 'marketplace'];

export const upgradeEffectSchema = z.object({
  type: z.string().min(1),
  value: z.union([z.number(), z.boolean()])
});

export const upgradeCostSchema = z.object({
  coins: z.number().min(0).optional(),
  materials: z.record(z.string(), z.number()).optional()
});

export const upgradeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  category: z.enum(UPGRADE_CATEGORIES),
  tier: z.number().int().min(1),
  cost: upgradeCostSchema,
  effect: upgradeEffectSchema,
  maxLevel: z.number().int().min(1).optional()
});

export const upgradesDataSchema = z.object({
  upgrades: z.array(upgradeSchema)
});
