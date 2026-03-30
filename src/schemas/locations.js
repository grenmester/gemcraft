import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  unlockLevel: z.number().int().min(0),
  unlockEquipment: z.string().min(1),
  unlockMaterials: z.record(z.string(), z.number()).nullable()
});

export const locationsDataSchema = z.record(z.string(), locationSchema);
