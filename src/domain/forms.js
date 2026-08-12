// Crystal habit (§3 of the Explore spec). Two stones of the same species from
// the same method are not interchangeable: what shape they came out of the
// ground in decides what they can become. This is the Explore -> Cut link.
//
// Method decides the shape distribution; depth shifts it, because undisturbed
// pockets lie deep and river-tumbled pebbles do not.

export const FORM_LABELS = {
  waterworn: 'Waterworn pebble',
  crystal: 'Terminated crystal',
  fragment: 'Broken fragment',
  nodule: 'Massive nodule',
  druzy: 'Druzy cavity',
  matrix: 'Crystal on matrix'
};

export const FORM_POOLS = {
  panning: [
    { form: 'waterworn', weight: 70, depthBias: 0.7 },
    { form: 'fragment', weight: 20, depthBias: 0.9 },
    { form: 'crystal', weight: 10, depthBias: 1.6 }
  ],
  surface: [
    { form: 'fragment', weight: 45, depthBias: 0.9 },
    { form: 'nodule', weight: 30, depthBias: 1.0 },
    { form: 'waterworn', weight: 15, depthBias: 0.7 },
    { form: 'crystal', weight: 10, depthBias: 1.6 }
  ],
  geode: [
    { form: 'nodule', weight: 40, depthBias: 1.0 },
    { form: 'druzy', weight: 35, depthBias: 1.1 },
    { form: 'crystal', weight: 25, depthBias: 1.6 }
  ],
  hardrock: [
    { form: 'fragment', weight: 45, depthBias: 0.9 },
    { form: 'crystal', weight: 40, depthBias: 1.5 },
    { form: 'matrix', weight: 10, depthBias: 1.8 },
    { form: 'druzy', weight: 5, depthBias: 1.0 }
  ]
};

/**
 * `styles` are the cut styles this shape admits (see `style` in
 * cutTechniques.yaml). `facetedYield` scales carat retention on faceted cuts
 * only — a cabochon does not care how the rough arrived.
 */
export const FORM_EFFECTS = {
  waterworn: { styles: ['faceted', 'cabochon'], facetedYield: 0.9 },
  crystal: { styles: ['faceted', 'cabochon'], facetedYield: 1.1 },
  fragment: { styles: ['faceted', 'cabochon'], facetedYield: 1.0 },
  nodule: { styles: ['cabochon'], facetedYield: 1.0 },
  druzy: { styles: ['cabochon'], facetedYield: 1.0 },
  matrix: { styles: [], facetedYield: 1.0 }
};

const FALLBACK_METHOD = 'panning';

export function rollForm(method, depth, rng = Math.random) {
  const pool = FORM_POOLS[method] ?? FORM_POOLS[FALLBACK_METHOD];
  const weighted = pool.map((e) => ({
    form: e.form,
    weight: e.weight * Math.pow(e.depthBias, depth - 1)
  }));
  const total = weighted.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng() * total;
  for (const e of weighted) {
    roll -= e.weight;
    if (roll < 0) return e.form;
  }
  return weighted[weighted.length - 1].form;
}
