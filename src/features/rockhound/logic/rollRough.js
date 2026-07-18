const lerp = ([lo, hi], t) => lo + (hi - lo) * t;
const round2 = (n) => Math.round(n * 100) / 100;
const defaultId = () => `spec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function createRough({ trueSpeciesId, caratWeight, clarity, colorGrade, origin }, idFactory = defaultId) {
  return {
    instanceId: idFactory(),
    stage: 'rough',
    trueSpeciesId,
    identifiedAs: null,
    caratWeight,
    clarity,
    colorGrade,
    origin
  };
}

export function rollRough(locality, rng = Math.random, idFactory = defaultId) {
  const pool = locality.findPool;
  const total = pool.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng() * total;
  let entry = pool[pool.length - 1];
  for (const e of pool) {
    roll -= e.weight;
    if (roll < 0) { entry = e; break; }
  }
  return createRough({
    trueSpeciesId: entry.species,
    caratWeight: round2(lerp(entry.caratRange, rng())),
    clarity: Math.round(lerp(entry.clarityRange, rng())),
    colorGrade: Math.round(lerp(entry.colorRange, rng())),
    origin: locality.id
  }, idFactory);
}
