import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LocalityEntry from './LocalityEntry.jsx';

const SPECIES_BY_ID = {
  spinel: { id: 'spinel', name: 'Spinel', rarity: 'Rare' },
  ruby: { id: 'ruby', name: 'Ruby', rarity: 'Epic' },
  tanzanite: { id: 'tanzanite', name: 'Tanzanite', rarity: 'Epic' }
};

const MOGOK = {
  id: 'mogok_marble',
  name: 'Mogok Marble',
  region: 'myanmar',
  depositType: 'metamorphic',
  method: 'hardrock',
  hostRock: 'marble',
  indicatorMinerals: ['spinel', 'pyrope_garnet'],
  color: '#b23a48',
  unlockGate: { allOf: [{ type: 'reputation', tier: 3 }] },
  findPool: [
    { species: 'spinel', weight: 50 },
    { species: 'ruby', weight: 20 },
    { species: 'tanzanite', weight: 5 }
  ]
};

const PIPE = {
  id: 'kimberlite_pipe',
  name: 'Kimberlite Pipe',
  unlockGate: { allOf: [{ type: 'setComplete', setType: 'locality', id: 'mogok_marble' }] },
  findPool: [{ species: 'ruby', weight: 1 }]
};

function renderEntry(overrides = {}) {
  const props = {
    locality: MOGOK,
    localities: [MOGOK, PIPE],
    speciesById: SPECIES_BY_ID,
    gemdex: ['spinel'],
    unlocked: true,
    onClose: vi.fn(),
    ...overrides
  };
  render(<LocalityEntry {...props} />);
  return props;
}

describe('LocalityEntry', () => {
  it('names the locality in a labelled dialog', () => {
    renderEntry();
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
    screen.getByRole('heading', { name: 'Mogok Marble' });
  });

  it('shows geology, method, host rock and region', () => {
    renderEntry();
    // The header combines deposit type and method in one string; the Access
    // section's own "Deposit" row also says "metamorphic" alone, so scope
    // this to the header's distinctive combined text.
    screen.getByText(/metamorphic · hardrock/i);
    screen.getByText(/Myanmar/);
    screen.getByText('marble');
  });

  it('shows a satisfied access requirement for an unlocked locality', () => {
    renderEntry();
    const access = screen.getByText(/reputation tier 3/i);
    expect(access.textContent).toMatch(/✓/);
    expect(access.textContent).toBe('✓ Unlocked with reputation tier 3');
  });

  it('shows a pending access requirement for a locked locality', () => {
    renderEntry({ unlocked: false });
    const access = screen.getByText(/reputation tier 3/i);
    expect(access.textContent).toMatch(/🔒/);
    expect(access.textContent).toBe('🔒 Reach reputation tier 3');
  });

  it('lists indicator minerals to prospect for', () => {
    renderEntry();
    screen.getByText(/Pyrope Garnet/);
  });

  it('names discovered pool species and withholds undiscovered ones', () => {
    renderEntry();
    screen.getByText('Spinel');
    expect(screen.queryByText('Ruby')).toBeNull();
    expect(screen.getAllByText('???').length).toBe(2);
  });

  it('shows exact find percentages, never the raw authoring weights', () => {
    renderEntry();
    // pool weights 50/20/5 (total 75) -> 66.7% / 26.7% / 6.7%
    screen.getByText('66.7%');
    screen.getByText('26.7%');
    screen.getByText('6.7%');
    // the raw weight 50 must not appear anywhere
    expect(screen.queryByText(/\b50\b/)).toBeNull();
  });

  it('shows the chance for undiscovered species too, without naming them', () => {
    renderEntry();
    // ruby is undiscovered but its odds are still informative while prototyping
    const rubyRow = screen.getByText('26.7%').closest('li');
    expect(rubyRow.textContent).toMatch(/\?\?\?/);
  });

  it('shows the rarity ceiling even though the rare species are unfound', () => {
    renderEntry();
    screen.getByText(/up to Epic/i);
  });

  it('shows set progress', () => {
    renderEntry();
    screen.getByText('1 / 3');
  });

  it('reveals which locality a completed set opens', () => {
    renderEntry();
    screen.getByText(/Kimberlite Pipe/);
  });

  it('says so when a completed set opens nothing', () => {
    renderEntry({ localities: [MOGOK] });
    expect(screen.queryByText(/Kimberlite Pipe/)).toBeNull();
  });

  it('closes on the close button', () => {
    const { onClose } = renderEntry();
    fireEvent.click(screen.getByRole('button', { name: /close entry/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
