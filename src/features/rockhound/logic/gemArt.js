// Placeholder art layer for the Gemdex. Real sprites will replace the glyphs
// later; keeping the mapping here means only this file and the tile markup
// change. Tints are the species' natural color anchor from
// docs/research/gem-reference.md (§7 art direction).

const ART = {
  quartz:           { glyph: '💧', tint: '#dfe7f0' },
  amethyst:         { glyph: '🟣', tint: '#7a4fa0' },
  citrine:          { glyph: '🟡', tint: '#e8a417' },
  agate:            { glyph: '🪨', tint: '#a9846a' },
  almandine_garnet: { glyph: '🔴', tint: '#8c2b32' },
  tsavorite:        { glyph: '🟩', tint: '#17a05a' },
  sapphire:         { glyph: '🔵', tint: '#2f5fc0' },
  ruby:             { glyph: '❤️', tint: '#c62d3a' },
  aquamarine:       { glyph: '🌊', tint: '#5fc4d0' },
  emerald:          { glyph: '💚', tint: '#1f8f57' },
  topaz:            { glyph: '🔶', tint: '#d98f3a' },
  spinel:           { glyph: '🌸', tint: '#d4557a' },
  peridot:          { glyph: '🫒', tint: '#8aab2a' },
  tanzanite:        { glyph: '🔷', tint: '#4a52b8' },
  tourmaline:       { glyph: '🍉', tint: '#4aa84a' },
  moonstone:        { glyph: '🌙', tint: '#c2d2e2' },
  opal:             { glyph: '🌈', tint: '#7ec8c0' },
  alexandrite:      { glyph: '🎭', tint: '#5f8f5f' },
  diamond:          { glyph: '💎', tint: '#e6eef7' },
  fluorite:         { glyph: '🧊', tint: '#6f8fd0' },
  obsidian:         { glyph: '⚫', tint: '#26262b' }
};

const FALLBACK = { glyph: '🪨', tint: '#8a8f98' };

/**
 * Art for a species id. `known` is false for ids with no entry, which the
 * roster guard test uses to catch species added without art.
 */
export function gemArt(speciesId) {
  const art = ART[speciesId];
  return art ? { ...art, known: true } : { ...FALLBACK, known: false };
}

// Every color name appearing in species.yaml. Names describing an effect
// rather than a single hue (banded, sheen, play-of-color, multicolor,
// watermelon) get an approximating hue until real art lands.
const COLOR_HEX = {
  amber: '#ffbf00',
  banded: '#b98a5a',
  black: '#1c1c1e',
  blue: '#2f6fd0',
  'blue-green': '#1d8a8a',
  'blue-sheen': '#8fb8dd',
  'blue-violet': '#5a4fc0',
  brown: '#7a5230',
  'brownish-red': '#8c3b2e',
  colorless: '#e8eef5',
  cyan: '#4fd1e0',
  gray: '#9aa0a6',
  green: '#2f9e5b',
  lavender: '#c3a6e0',
  multicolor: '#b06fd0',
  olive: '#7c8a3a',
  orange: '#f08a2c',
  pink: '#f08ab0',
  'pinkish-red': '#e0456b',
  'play-of-color': '#6fd0c0',
  purple: '#7a4fa0',
  'purple-red': '#a03a5a',
  red: '#c62d3a',
  sheen: '#b9c2cc',
  sherry: '#b5603a',
  violet: '#7d5fd0',
  'vivid-green': '#17c964',
  watermelon: '#e0507a',
  white: '#f2f4f7',
  yellow: '#f2c744',
  'yellow-green': '#a8cf3a'
};

/** Hex swatch for a color name from species.yaml, or '' if unmapped. */
export function colorHex(name) {
  return COLOR_HEX[name] ?? '';
}
