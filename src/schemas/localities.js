import { z } from 'zod';

// A locality is a place on the world map (§5). Its `depositType` sets the
// collection `method` and its `findPool`; its `unlockGate` is a heterogeneous
// (per-locality) requirement tree enabling the nonlinear map of §8.4.

export const DEPOSIT_TYPE_ENUM = [
  'alluvial', 'pegmatite', 'hydrothermal', 'metamorphic', 'volcanic'
];

export const METHOD_ENUM = ['panning', 'hardrock', 'geode', 'surface'];

// --- Unlock gate: a recursive allOf/anyOf tree of conditions (§8.4) ---

export const GATE_SET_TYPE_ENUM = ['locality', 'family'];

export const gateConditionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('gear'), id: z.string().min(1) }),
  z.object({ type: z.literal('reputation'), tier: z.number().int().min(0) }),
  z.object({
    type: z.literal('setComplete'),
    setType: z.enum(GATE_SET_TYPE_ENUM),
    id: z.string().min(1)
  }),
  // cash gates only *accelerate*, never hard-gate (accelerator defaults true)
  z.object({
    type: z.literal('cash'),
    amount: z.number().min(0),
    accelerator: z.boolean().optional().default(true)
  })
]);

// A group may contain conditions or nested groups. An empty group ({}) means
// "always unlocked" (used by starter localities).
export const gateGroupSchema = z.lazy(() =>
  z
    .object({
      allOf: z.array(z.union([gateConditionSchema, gateGroupSchema])).optional(),
      anyOf: z.array(z.union([gateConditionSchema, gateGroupSchema])).optional()
    })
    .strict()
);

// --- Find pool: weighted species with base-stat ranges rolled onto rough ---

const statRange = z
  .tuple([z.number().min(0).max(100), z.number().min(0).max(100)])
  .refine(([lo, hi]) => lo <= hi, { message: 'range min must be <= max' });

export const findPoolEntrySchema = z.object({
  species: z.string().min(1), // species id (cross-checked in tests)
  weight: z.number().positive(),
  // Weight is multiplied by depthBias^(depth-1): below 1 thins out with
  // depth, above 1 concentrates. minDepth excludes the entry above that
  // depth entirely — this is how a locality gets finds you must dive for.
  depthBias: z.number().positive().optional().default(1),
  minDepth: z.number().int().min(1).optional().default(1),
  caratRange: z
    .tuple([z.number().positive(), z.number().positive()])
    .refine(([lo, hi]) => lo <= hi, { message: 'caratRange min must be <= max' }),
  clarityRange: statRange,
  colorRange: statRange
});

export const localitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  depositType: z.enum(DEPOSIT_TYPE_ENUM),
  method: z.enum(METHOD_ENUM),
  hostRock: z.string().min(1),
  maxDepth: z.number().int().min(3).max(5), // the locality's bedrock
  indicatorMinerals: z.array(z.string().min(1)).optional().default([]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  findPool: z.array(findPoolEntrySchema).min(1),
  unlockGate: gateGroupSchema
});

export const localitiesDataSchema = z.object({
  localities: z.array(localitySchema).min(1)
});
