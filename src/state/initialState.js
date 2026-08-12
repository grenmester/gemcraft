import { speciesById } from '../data/species/loader.js';
import { huesForSpecies } from '../domain/hues.js';
import { UNKNOWN_HUE } from '../domain/traits.js';

export const initialRockhoundState = {
  rough: [],
  // { localityId, since } — where the rocker box (the idle device, gear id
  // `rocker_box`) is working. Unrelated to the `sieve` gear id in
  // domain/market.js's SHOP_GEAR, which is a different, ordinary shop item —
  // do not gate idle behaviour on `gear.includes('sieve')`.
  sieve: null,
  exploreMethodXp: { panning: 0, hardrock: 0, geode: 0, surface: 0 },
  identified: [],
  gemdex: [],
  newlyDiscovered: [],
  reputation: 0,
  gear: [],
  testMastery: { scratch: 0, heft: 0, uv: 0 },
  cutTechniqueLevel: {},
  bestSpecimens: {},
  lastCutResult: null,
  cash: 0,
  stones: []
};

/**
 * Give a hue to rough that predates the hue field, or was saved with
 * UNKNOWN_HUE — rolled from the stone's own species with huesForSpecies, the
 * same draw rollRough itself makes, so a backfilled stone is indistinguishable
 * from a freshly dug one. Hue is the only thing that separates varieties
 * within a mineral family (see traits.js), so a rough that never gets one can
 * never resolve — see the guard in src/data/foundation.test.js.
 *
 * Also defaults `revealed` to {} on any rough that lacks it, for the same
 * "specimens saved before this shape existed" reason.
 *
 * Impure (Math.random) exactly like loadInitialState, which is the only
 * caller — never the reducer.
 */
export function backfillRough(rough) {
  const revealed = rough.revealed ?? {};
  if (rough.hue && rough.hue !== UNKNOWN_HUE) return { ...rough, revealed };
  const hues = huesForSpecies(speciesById[rough.trueSpeciesId]);
  const hue = hues.length > 0 ? hues[Math.min(Math.floor(Math.random() * hues.length), hues.length - 1)] : UNKNOWN_HUE;
  return { ...rough, hue, revealed };
}
