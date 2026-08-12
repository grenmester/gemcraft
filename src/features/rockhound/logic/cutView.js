import { canApply, cutSuccessProbability, canShatter, formAllows, formYield } from '../../../domain/cut.js';
import { FORM_LABELS, FORM_EFFECTS } from '../../../domain/forms.js';
import { isMeasured, measuredQuality } from '../../../domain/grading.js';
import { round2 } from '../../../shared/math.js';

const pct = (x) => Math.round(x * 100);

const STYLE_PHRASE = { cabochon: 'a cabochon', faceted: 'faceting' };

/**
 * Player-facing reason a habit blocks this cut, distinct from a species
 * mismatch. Only meaningful once `formAllows` has already said no.
 * forms.js owns which styles a habit admits (FORM_EFFECTS) and what to call
 * it (FORM_LABELS) — this only turns that into a sentence, it does not
 * re-derive the rule.
 */
function habitUnsuitableReason(form) {
  const label = FORM_LABELS[form];
  const effect = FORM_EFFECTS[form];
  if (!label || !effect) return null;
  const named = label.toLowerCase();
  if (effect.styles.length === 0) {
    return `this piece is a ${named} — it cannot be cut at all`;
  }
  if (effect.styles.length === 1) {
    return `this piece is a ${named} — only ${STYLE_PHRASE[effect.styles[0]]} will work`;
  }
  return null;
}

/**
 * A technique as it applies to the selected stone. `successPct` is the TRUE
 * probability applyCut will roll against — the technique's own curve scaled by
 * the species' cut difficulty — not the bare curve value.
 *
 * `specimen` is optional and defaults to no habit constraint, so callers that
 * predate crystal habit (or have no stone selected) behave exactly as before.
 */
export function techniqueView(species, technique, level, specimen = null) {
  const unlocked = level >= 1;
  const speciesOk = !!species && canApply(species, technique);
  const habitOk = formAllows(specimen?.form, technique);
  const suitable = speciesOk && habitOk;

  let unsuitableReason = null;
  if (species && !speciesOk) {
    unsuitableReason = `${species.name} does not take this cut`;
  } else if (species && !habitOk) {
    unsuitableReason = habitUnsuitableReason(specimen?.form)
      ?? `${species.name} cannot take this cut in its current form`;
  }

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
    unsuitableReason
  };
}

/**
 * Carat the stone would retain, as a [low, high] range. Uses the MEASURED
 * carat, not the true one — carat is exact, so the two coincide once
 * weighed, but an unweighed stone must not yield a carat-based estimate from
 * a weight the player never read.
 */
export function expectedCarat(specimen, technique) {
  const w = isMeasured(specimen, 'weigh') ? measuredQuality(specimen).caratWeight : 0;
  const yieldFactor = formYield(specimen.form, technique);
  return [round2(w * technique.yieldRange[0] * yieldFactor), round2(w * technique.yieldRange[1] * yieldFactor)];
}
