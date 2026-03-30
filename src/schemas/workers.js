import { z } from 'zod';

export const workerStatsSchema = z.object({
  efficiency: z.number().min(0).max(100),
  luck: z.number().min(0).max(100),
  speed: z.number().min(0).max(100)
});

export const workerCostSchema = z.object({
  coins: z.number().min(0).optional(),
  materials: z.record(z.string(), z.number()).optional()
});

export const workerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  maxLevel: z.number().int().min(1),
  baseXpPerAction: z.number().min(1),
  xpToLevel: z.number().min(1),
  stats: workerStatsSchema,
  cost: workerCostSchema
});

export const workersDataSchema = z.object({
  workers: z.array(workerSchema)
});
