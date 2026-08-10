// What a stone looks like at a glance. The data describes colours in trade
// terms ("pinkish-red", "sherry"); an untrained eye reports a bare hue. That
// gap is the point: collapsing shades onto hues is what keeps sight from
// identifying everything by itself.
//
// Measured against the real roster: matching a species' full colour list would
// let sight alone resolve 89% of stones. Coarse hues plus transparency resolve
// 40%, leaving 60% that genuinely need instruments.

export const HUE_BY_COLOUR = {
  red: 'red', 'pinkish-red': 'red', 'brownish-red': 'red', 'purple-red': 'red',
  pink: 'pink',
  purple: 'purple', violet: 'purple', lavender: 'purple', 'blue-violet': 'purple',
  blue: 'blue', cyan: 'blue', 'blue-green': 'blue', 'blue-sheen': 'blue',
  green: 'green', 'vivid-green': 'green', olive: 'green', 'yellow-green': 'green',
  yellow: 'yellow', amber: 'yellow', sherry: 'yellow',
  orange: 'orange',
  colorless: 'colorless', white: 'colorless', sheen: 'colorless',
  gray: 'gray', brown: 'brown', black: 'black',
  banded: 'banded', multicolor: 'banded', 'play-of-color': 'banded', watermelon: 'banded'
};

/** The hue an untrained eye would report for a trade colour word. */
export function hueOf(colourWord) {
  return HUE_BY_COLOUR[colourWord] ?? colourWord;
}

/** Every hue this species can appear in, deduped and sorted. */
export function huesForSpecies(species) {
  return [...new Set((species.colors ?? []).map(hueOf))].sort();
}
