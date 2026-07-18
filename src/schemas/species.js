import { z } from 'zod';
import { RARITY_ENUM } from './items.js';

// A species is a mineral/gem definition carrying the real diagnostic
// properties that drive Identify (§6) and the craft data that drives Cut (§7).
// This is the v5.0 game-data model; it lives alongside the legacy items.yaml
// until the feature layer migrates onto it.

export const SPECIES_CATEGORY_ENUM = ['Gem', 'Mineral'];

// Crystal habit — the shape a crystal grows in (a free Identify observation).
export const HABIT_ENUM = [
  'prismatic', 'tabular', 'cubic', 'octahedral', 'dodecahedral',
  'rhombohedral', 'bladed', 'acicular', 'massive', 'botryoidal',
  'druzy', 'granular'
];

export const LUSTER_ENUM = [
  'adamantine', 'vitreous', 'sub-vitreous', 'resinous', 'greasy',
  'silky', 'pearly', 'waxy', 'metallic', 'dull'
];

export const TRANSPARENCY_ENUM = ['transparent', 'translucent', 'opaque'];

// Cleavage — how cleanly a mineral splits along crystal planes. Drives
// cut risk in §7.3 (perfect cleavage → shatter risk on hard cuts).
export const CLEAVAGE_ENUM = ['none', 'poor', 'fair', 'good', 'perfect'];

export const FRACTURE_ENUM = [
  'conchoidal', 'uneven', 'even', 'splintery', 'hackly', 'earthy'
];

// Optical phenomena revealed by the correct cut (§7.4 trait flags).
export const PHENOMENON_ENUM = [
  'asterism', 'chatoyancy', 'color_change', 'play_of_color',
  'adularescence', 'labradorescence', 'iridescence', 'aventurescence'
];

// Hardness / refractive index may be a single point or a [min, max] range.
const numberOrRange = z.union([
  z.number(),
  z.tuple([z.number(), z.number()])
]);

const mohsValue = z.number().min(1).max(10);
export const hardnessSchema = z.union([
  mohsValue,
  z.tuple([mohsValue, mohsValue])
]);

// Fluorescence response under long-/short-wave UV. `null` = inert.
export const fluorescenceSchema = z
  .object({
    longwave: z.string().min(1),
    shortwave: z.string().min(1)
  })
  .nullable();

export const phenomenonSchema = z.object({
  type: z.enum(PHENOMENON_ENUM),
  revealedBy: z.string().min(1) // cut technique id (cross-checked in tests)
});

export const speciesSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(SPECIES_CATEGORY_ENUM),
  family: z.string().min(1),
  rarity: z.enum(RARITY_ENUM),

  // --- diagnostic properties (drive Identify) ---
  hardness: hardnessSchema,
  specificGravity: z.number().positive(),
  habit: z.array(z.enum(HABIT_ENUM)).min(1),
  luster: z.enum(LUSTER_ENUM),
  transparency: z.enum(TRANSPARENCY_ENUM),
  colors: z.array(z.string().min(1)).min(1),
  streak: z.string().min(1),
  fluorescence: fluorescenceSchema,
  refractiveIndex: numberOrRange.nullable().optional(),
  cleavage: z.enum(CLEAVAGE_ENUM),
  fracture: z.enum(FRACTURE_ENUM).optional(),

  // --- value / craft ---
  baseValue: z.number().min(0),
  suitableCuts: z.array(z.string().min(1)).min(1), // cut technique ids
  cutDifficulty: z.number().int().min(1).max(5),
  phenomena: z.array(phenomenonSchema).optional().default([]),

  // --- flavor / reference ---
  occursAt: z.array(z.string().min(1)).optional(), // locality ids (findPool is source of truth)
  realWorldLocations: z.array(z.string().min(1)).min(1),
  funFact: z.string().optional()
});

export const speciesDataSchema = z.object({
  species: z.array(speciesSchema).min(1)
});
