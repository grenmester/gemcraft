import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LocalityMap from './LocalityMap.jsx';
import { localities } from '../../../data/localities/loader.js';
import { speciesById } from '../../../data/species/loader.js';
import { xpThreshold } from '../logic/dive.js';

function renderMap(overrides = {}) {
  const props = {
    localities,
    unlockedIds: ['hidden_creek'],
    selectedId: 'hidden_creek',
    onSelect: vi.fn(),
    speciesById,
    gemdex: ['quartz'],
    ...overrides
  };
  render(<LocalityMap {...props} />);
  return props;
}

describe('LocalityMap', () => {
  it('renders unlocked localities as enabled and locked ones with a hint', () => {
    renderMap();
    const creek = screen.getByRole('button', { name: /^Hidden Creek,/ });
    expect(creek.disabled).toBe(false);
    screen.getByText(/Needs the sieve/i);
  });

  it('keeps the requirement text out of the select button accessible name', () => {
    renderMap();
    const creek = screen.getByRole('button', { name: /^Hidden Creek,/ });
    expect(creek.textContent).not.toMatch(/Open from the start/i);
  });

  it('shows the satisfied requirement for an unlocked locality', () => {
    renderMap();
    // Hidden Creek has an empty gate; it reads as open rather than hiding the row
    expect(screen.getAllByText(/Open from the start/i).length).toBeGreaterThan(0);
  });

  it('selects a locality when its card is clicked', () => {
    const { onSelect } = renderMap();
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek,/ }));
    expect(onSelect).toHaveBeenCalledWith('hidden_creek');
  });

  it('does not select a locked locality', () => {
    const { onSelect } = renderMap();
    const locked = screen.getByRole('button', { name: /^Gravel Bar,/ });
    expect(locked.disabled).toBe(true);
    fireEvent.click(locked);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows set progress on the card', () => {
    renderMap();
    // hidden_creek pools 4 species; the player has found quartz. '1 / 4' is not
    // unique across cards (gravel_bar pools the same four species), so scope
    // the assertion to the Hidden Creek card rather than querying the page.
    const creek = screen.getByRole('button', { name: /^Hidden Creek,/ });
    expect(creek.textContent).toMatch(/1 \/ 4/);
  });

  it('carries the set progress and collection method in the accessible name', () => {
    renderMap();
    const creek = screen.getByRole('button', { name: /^Hidden Creek,/ });
    const label = creek.getAttribute('aria-label');
    expect(label).toMatch(/1 of 4 found/);
    expect(label).toMatch(/panning/i);
  });

  it('opens the field guide from the info button without selecting', () => {
    const { onSelect } = renderMap();
    fireEvent.click(screen.getByRole('button', { name: /Hidden Creek field guide/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('opens the field guide for a locked locality too', () => {
    renderMap();
    fireEvent.click(screen.getByRole('button', { name: /Gravel Bar field guide/i }));
    screen.getByRole('heading', { name: 'Gravel Bar' });
  });

  it('closes the field guide again', () => {
    renderMap();
    fireEvent.click(screen.getByRole('button', { name: /Hidden Creek field guide/i }));
    fireEvent.click(screen.getByRole('button', { name: /close entry/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('withholds undiscovered species on the card', () => {
    renderMap();
    expect(screen.queryByText('Sapphire')).toBeNull();
  });
});

describe('locality card information design', () => {
  it('shows the collection method and its level, since that decides the xp track', () => {
    renderMap({
      gemdex: [],
      exploreMethodXp: { panning: xpThreshold(3), hardrock: 0, geode: 0, surface: 0 }
    });
    // Asserting only the method would prove nothing — the method was already
    // on the card before this change. The LEVEL is the new information, and
    // it is what explains why one site offers a descent and another does not.
    const creek = screen.getByRole('button', { name: /^Hidden Creek,/ }).closest('li');
    expect(creek.textContent).toMatch(/panning/i);
    expect(creek.textContent).toMatch(/level 3/i);

    // A different method reads its own track, not panning's.
    const vug = screen.getByRole('button', { name: /^Amethyst Vug,/ }).closest('li');
    expect(vug.textContent).toMatch(/geode/i);
    expect(vug.textContent).toMatch(/level 0/i);
  });

  it('does not clutter the card with the deposit type', () => {
    renderMap({ gemdex: [] });
    const card = screen.getByRole('button', { name: /^Hidden Creek,/ }).closest('li');
    // Deposit type is teaching payload with no mechanical effect — it belongs
    // in the field guide, where someone is reading rather than scanning.
    expect(card.textContent).not.toMatch(/alluvial/i);
  });

  it('drops the vague rarity ceiling', () => {
    renderMap({ gemdex: [] });
    expect(screen.queryByText(/up to Epic/i)).toBeNull();
  });

  it('rings a discovered species with its rarity colour, and withholds it otherwise', () => {
    renderMap({ gemdex: ['sapphire'] });
    const card = screen.getByRole('button', { name: /^Hidden Creek,/ }).closest('li');
    const slots = card.querySelectorAll('[data-rarity]');
    const known = [...slots].filter((s) => s.getAttribute('data-rarity') !== 'unknown');
    expect(known).toHaveLength(1);
    expect(known[0].getAttribute('data-rarity')).toBe('Epic');
  });

  it('opens the field guide from a labelled icon button, not a bare emoji', () => {
    renderMap({ gemdex: [] });
    const info = screen.getByRole('button', { name: /Hidden Creek field guide/i });
    expect(info.textContent).not.toMatch(/ℹ/);
    expect(info.querySelector('svg')).not.toBe(null);
  });
});
