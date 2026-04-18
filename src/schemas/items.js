import { z } from 'zod';

export const RARITY_ENUM = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
export const CATEGORY_ENUM = ['Gem', 'Mineral', 'Ore', 'Metal'];

export const itemProcessingSchema = z.object({
  canClean: z.boolean().optional(),
  canCut: z.boolean().optional(),
  canFacet: z.boolean().optional(),
  canRefine: z.boolean().optional(),
  refineOutput: z.string().optional(),
  baseProcessTime: z.number().min(1).optional(),
  processDifficulty: z.number().min(1).max(5).optional()
}).optional();

export const itemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(CATEGORY_ENUM),
  hardness: z.number().min(1).max(10),
  value: z.number().min(0),
  rarity: z.enum(RARITY_ENUM),
  realWorldLocations: z.array(z.string()).min(1),
  processing: itemProcessingSchema.optional(),
  refinesTo: z.string().optional()
});

export const itemsDataSchema = z.object({
  items: z.array(itemSchema)
});
