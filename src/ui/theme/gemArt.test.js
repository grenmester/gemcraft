import { describe, it, expect } from 'vitest';
import { gemArt, colorHex } from './gemArt.js';
import { species } from '../../data/species/loader.js';

describe('gemArt', () => {
  it('gives every species in the roster its own art entry', () => {
    // Guard: adding a species to species.yaml must fail loudly until art exists.
    const missing = species.filter((s) => !gemArt(s.id).known);
    expect(missing.map((s) => s.id)).toEqual([]);
  });

  it('returns distinct glyphs so species are visually separable', () => {
    const glyphs = species.map((s) => gemArt(s.id).glyph);
    expect(new Set(glyphs).size).toBe(species.length);
  });

  it('falls back to a neutral rock for an unknown id', () => {
    const art = gemArt('not_a_species');
    expect(art.known).toBe(false);
    expect(art.glyph).toBe('🪨');
  });

  it('maps every color name used in the roster to a hex swatch', () => {
    const names = [...new Set(species.flatMap((s) => s.colors))];
    const unmapped = names.filter((n) => !colorHex(n));
    expect(unmapped).toEqual([]);
  });

  it('returns hex values', () => {
    expect(colorHex('red')).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
