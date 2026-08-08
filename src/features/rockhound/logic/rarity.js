// Rarity is shown as a ring, never as a fill: background tint already means
// the gem's own colour everywhere else (see GemGlyph). Two meanings on one
// channel would contradict each other.
const RARITY_COLORS = {
  Common: '#A0A0A0',
  Uncommon: '#4CAF50',
  Rare: '#2196F3',
  Epic: '#9C27B0',
  Legendary: '#FF9800'
};

/** Neutral ring for an unknown tier, and for species not yet discovered. */
const UNKNOWN_COLOR = '#475569';

export function rarityColor(rarity) {
  return RARITY_COLORS[rarity] ?? UNKNOWN_COLOR;
}
