const RARITY_REP = { Common: 5, Uncommon: 10, Rare: 20, Epic: 35, Legendary: 60 };

export function identifyReward(species) {
  return RARITY_REP[species.rarity] ?? 5;
}

export function commitIdentification(specimen, guessId) {
  const correct = specimen.trueSpeciesId === guessId;
  return {
    correct,
    specimen: { ...specimen, stage: correct ? 'identified' : 'rough', identifiedAs: guessId }
  };
}
