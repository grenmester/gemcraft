import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import GemGlyph from './GemGlyph.jsx';
import { gemArt } from '../theme/gemArt.js';

describe('GemGlyph', () => {
  it("renders the species' glyph and tint", () => {
    const { container } = render(<GemGlyph speciesId="ruby" variant="card" />);
    const tile = container.firstChild;
    expect(tile.textContent).toBe(gemArt('ruby').glyph);
    expect(tile.getAttribute('style')).toMatch(/background-color/);
  });

  it('is hidden from assistive tech, being decoration beside a label', () => {
    const { container } = render(<GemGlyph speciesId="ruby" />);
    expect(container.firstChild.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders a neutral placeholder with no tint when hidden', () => {
    const { container } = render(<GemGlyph speciesId="ruby" hidden />);
    const tile = container.firstChild;
    expect(tile.textContent).toBe('❔');
    // the real tint must not leak for an undiscovered species
    expect(tile.getAttribute('style')).toBeNull();
  });

  it('applies a different size per variant', () => {
    const hero = render(<GemGlyph speciesId="ruby" variant="hero" />).container.firstChild.className;
    const pool = render(<GemGlyph speciesId="ruby" variant="pool" />).container.firstChild.className;
    expect(hero).not.toBe(pool);
    expect(hero).toMatch(/h-20/);
    expect(pool).toMatch(/h-7/);
  });
});
