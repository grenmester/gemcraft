import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LocalityMap from './LocalityMap.jsx';
import { localities } from '../../../loaders/localities.js';
import { speciesById } from '../../../loaders/species.js';

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
    expect(creek.textContent).not.toMatch(/available now/i);
  });

  it('shows the satisfied requirement for an unlocked locality', () => {
    renderMap();
    // Hidden Creek has an empty gate; it reads as open rather than hiding the row
    expect(screen.getAllByText(/available now/i).length).toBeGreaterThan(0);
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

  it('carries the set progress and rarity ceiling in the accessible name', () => {
    renderMap();
    const creek = screen.getByRole('button', { name: /^Hidden Creek,/ });
    const label = creek.getAttribute('aria-label');
    expect(label).toMatch(/1 of 4 found/);
    expect(label).toMatch(/up to /);
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
