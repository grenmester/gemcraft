import { describe, it, expect } from 'vitest';
import { rarityColor } from './rarity.js';
import { RARITY_ENUM } from '../../../schemas/species.js';

describe('rarityColor', () => {
  it('gives every tier its own colour', () => {
    const colors = RARITY_ENUM.map(rarityColor);
    expect(new Set(colors).size).toBe(RARITY_ENUM.length);
  });

  it('returns a hex colour for every tier', () => {
    for (const r of RARITY_ENUM) {
      expect(rarityColor(r), r).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('falls back to a neutral colour for an unknown or withheld rarity', () => {
    // Undiscovered species deliberately carry no rarity.
    expect(rarityColor(null)).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(rarityColor('Mythic')).toBe(rarityColor(null));
  });
});
