import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Market from './Market.jsx';
import { speciesById } from '../../../loaders/species.js';

const identified = [{ instanceId: 'g1', trueSpeciesId: 'sapphire', identifiedAs: 'sapphire', caratWeight: 2, clarity: 80, colorGrade: 80, origin: 'hidden_creek' }];
const stones = [{ instanceId: 'st1', trueSpeciesId: 'sapphire', cut: 'cabochon', cutQuality: 90, phenomena: ['asterism'], caratRetained: 1.6, clarity: 80, colorGrade: 80, score: 88 }];

function setup(over = {}) {
  const props = {
    cash: 0, identified, stones, speciesById, ownedGear: [],
    onSellIdentified: vi.fn(), onSellStone: vi.fn(), onBuyGear: vi.fn(), ...over
  };
  render(<Market {...props} />);
  return props;
}

describe('Market', () => {
  it('shows current cash', () => {
    setup({ cash: 425 });
    screen.getByText(/425/);
  });

  it('sells an identified specimen', () => {
    const p = setup();
    fireEvent.click(screen.getAllByRole('button', { name: /Sell/i })[0]);
    expect(p.onSellIdentified).toHaveBeenCalledWith('g1');
  });

  it('sells a cut stone', () => {
    const p = setup({ identified: [] }); // only the stone is sellable → its Sell button is first
    fireEvent.click(screen.getByRole('button', { name: /Sell/i }));
    expect(p.onSellStone).toHaveBeenCalledWith('st1');
  });

  it('disables Buy for unaffordable gear and buys when affordable', () => {
    const p = setup({ cash: 200 }); // sieve 120 affordable, rock_hammer 300 not
    const buyButtons = screen.getAllByRole('button', { name: /Buy/i });
    const affordable = buyButtons.find((b) => !b.disabled);
    fireEvent.click(affordable);
    expect(p.onBuyGear).toHaveBeenCalledWith('sieve');
    expect(buyButtons.some((b) => b.disabled)).toBe(true); // rock_hammer disabled at cash 200
  });

  it('shows an empty state when nothing is sellable', () => {
    setup({ identified: [], stones: [] });
    screen.getByText(/nothing to sell/i);
  });
});
