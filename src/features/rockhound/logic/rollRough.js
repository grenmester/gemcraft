import { haulSize } from './dive.js';
import { rollForm } from './forms.js';

const lerp = ([lo, hi], t) => lo + (hi - lo) * t;
const round2 = (n) => Math.round(n * 100) / 100;
let idCounter = 0;
const defaultId = () => `spec-${Date.now()}-${(++idCounter).toString(36)}`;

export function createRough({ trueSpeciesId, caratWeight, clarity, colorGrade, origin, foundDepth = 1, form = 'fragment' }, idFactory = defaultId) {
  return {
    instanceId: idFactory(),
    stage: 'rough',
    trueSpeciesId,
    identifiedAs: null,
    caratWeight,
    clarity,
    colorGrade,
    origin,
    foundDepth,
    form
  };
}

/**
 * The find pool as it actually is at this depth: entries that need deeper
 * digging are absent, and every weight is scaled by its bias. The field
 * guide renders from this same function, so shown odds and rolled odds
 * cannot drift apart.
 */
export function effectivePool(findPool, depth) {
  return findPool
    .filter((e) => (e.minDepth ?? 1) <= depth)
    .map((e) => ({ ...e, effectiveWeight: e.weight * Math.pow(e.depthBias ?? 1, depth - 1) }));
}

/**
 * The pool a given collector may actually draw from: the depth pool, then
 * narrowed to an allowed set of species. The idle sieve uses this both to
 * report what it can catch at a locality and to do the catching, so the
 * number shown and the number rolled cannot drift apart.
 */
export function catchablePool(findPool, depth, allowedSpecies = null) {
  const pool = effectivePool(findPool, depth);
  return allowedSpecies ? pool.filter((e) => allowedSpecies.has(e.species)) : pool;
}

/** Best of `depth` draws — deeper ground gives up better material. */
export function bestOf(depth, rng) {
  let best = rng();
  for (let i = 1; i < depth; i++) best = Math.max(best, rng());
  return best;
}

export function rollRough(locality, depth, rng = Math.random, idFactory = defaultId, allowedSpecies = null) {
  const pool = catchablePool(locality.findPool, depth, allowedSpecies);
  if (pool.length === 0) return null;
  const total = pool.reduce((sum, e) => sum + e.effectiveWeight, 0);
  let roll = rng() * total;
  let entry = pool[pool.length - 1];
  for (const e of pool) {
    roll -= e.effectiveWeight;
    if (roll < 0) { entry = e; break; }
  }
  return createRough({
    trueSpeciesId: entry.species,
    caratWeight: round2(lerp(entry.caratRange, bestOf(depth, rng))),
    clarity: Math.round(lerp(entry.clarityRange, bestOf(depth, rng))),
    colorGrade: Math.round(lerp(entry.colorRange, bestOf(depth, rng))),
    origin: locality.id,
    foundDepth: depth,
    form: rollForm(locality.method, depth, rng)
  }, idFactory);
}

export function rollHaul(locality, depth, level, rng = Math.random, idFactory = defaultId) {
  return Array.from({ length: haulSize(depth, level) }, () =>
    rollRough(locality, depth, rng, idFactory)
  );
}
