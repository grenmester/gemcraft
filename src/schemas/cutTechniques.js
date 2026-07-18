import { z } from 'zod';
import { TRANSPARENCY_ENUM, PHENOMENON_ENUM } from './species.js';

// A cut technique is a lapidary style the player unlocks and levels (§7).
// Its `successCurve` maps technique level → base success probability
// (Lv1 ≈ 0.50 → Lv10 ≈ 0.90 with the default curve).

export const numberPair = z.tuple([z.number(), z.number()]);

// What material a technique is appropriate for (§7.1). All fields optional;
// an omitted field means "no constraint".
export const cutSuitabilitySchema = z.object({
  transparency: z.array(z.enum(TRANSPARENCY_ENUM)).optional(),
  phenomena: z.array(z.enum(PHENOMENON_ENUM)).optional()
});

export const successCurveSchema = z.object({
  base: z.number().min(0).max(1),
  perLevel: z.number().min(0),
  maxLevel: z.number().int().min(1)
});

export const cutTechniqueSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  difficulty: z.number().int().min(1).max(5),
  suitableFor: cutSuitabilitySchema.optional(),
  unlockMinigame: z.string().min(1),
  successCurve: successCurveSchema,
  yieldRange: numberPair, // fraction of carat retained on success, e.g. [0.55, 0.75]
  cutQualityRange: numberPair, // cut-quality % set on success
  catastrophicOnFail: z.boolean().optional().default(false),
  revealsPhenomena: z.array(z.enum(PHENOMENON_ENUM)).optional().default([])
});

export const cutTechniquesDataSchema = z.object({
  techniques: z.array(cutTechniqueSchema).min(1)
});
