export function seedCandidates(locality) {
  return [...new Set(locality.findPool.map((e) => e.species))];
}
