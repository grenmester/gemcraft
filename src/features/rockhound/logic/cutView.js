import { canApply, cutSuccessProbability, canShatter } from './cut.js';

const round2 = (n) => Math.round(n * 100) / 100;
const pct = (x) => Math.round(x * 100);

/**
 * A technique as it applies to the selected stone. `successPct` is the TRUE
 * probability applyCut will roll against — the technique's own curve scaled by
 * the species' cut difficulty — not the bare curve value.
 */
export function techniqueView(species, technique, level) {
  const unlocked = level >= 1;
  const suitable = !!species && canApply(species, technique);
  return {
    level,
    unlocked,
    suitable,
    successPct: unlocked && species ? pct(cutSuccessProbability(species, technique, level)) : null,
    keepsPct: [pct(technique.yieldRange[0]), pct(technique.yieldRange[1])],
    qualityRange: technique.cutQualityRange,
    reveals: (species?.phenomena ?? [])
      .filter((p) => p.revealedBy === technique.id)
      .map((p) => p.type),
    // Whether this pairing can shatter the stone at all (eligibility only —
    // applyCut additionally requires a failed roll above 0.9 to actually destroy it).
    shatterRisk: canShatter(species, technique),
    unsuitableReason: suitable || !species ? null : `${species.name} does not take this cut`
  };
}

/** Carat the stone would retain, as a [low, high] range. */
export function expectedCarat(specimen, technique) {
  const w = specimen.caratWeight ?? 0;
  return [round2(w * technique.yieldRange[0]), round2(w * technique.yieldRange[1])];
}
