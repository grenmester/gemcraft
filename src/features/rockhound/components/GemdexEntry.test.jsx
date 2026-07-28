import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GemdexEntry from './GemdexEntry.jsx';

const RUBY = {
  id: 'ruby', name: 'Ruby', category: 'Gem', family: 'corundum', rarity: 'Epic',
  hardness: 9, specificGravity: 4.0, habit: ['prismatic', 'tabular'],
  luster: 'vitreous', transparency: 'transparent', colors: ['red', 'pinkish-red'],
  streak: 'white', fluorescence: { longwave: 'red', shortwave: 'none' },
  refractiveIndex: [1.762, 1.77], cleavage: 'none', fracture: 'uneven',
  baseValue: 900, suitableCuts: ['cabochon', 'step'], cutDifficulty: 4,
  phenomena: [{ type: 'asterism', revealedBy: 'cabochon' }],
  realWorldLocations: ['Myanmar', 'Mozambique'],
  funFact: 'Ruby and sapphire are the same mineral.'
};

const LOCALITIES = [
  { id: 'mogok_marble', name: 'Mogok Marble', findPool: [{ species: 'ruby' }] },
  { id: 'secret_pipe', name: 'Secret Pipe', findPool: [{ species: 'ruby' }] }
];

const CUTS = { cabochon: { id: 'cabochon', name: 'Cabochon' }, step: { id: 'step', name: 'Step / Emerald Cut' } };

const FAMILY = { family: 'corundum', discovered: 1, total: 2, complete: false };

function renderEntry(overrides = {}) {
  const props = {
    species: RUBY, localities: LOCALITIES, unlockedIds: ['mogok_marble'],
    cutTechniquesById: CUTS, best: null, familyGroup: FAMILY, onClose: vi.fn(),
    ...overrides
  };
  render(<GemdexEntry {...props} />);
  return props;
}

describe('GemdexEntry', () => {
  it('renders as a labelled modal dialog naming the species', () => {
    renderEntry();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('heading', { name: 'Ruby' })).toBeTruthy();
  });

  it('shows family, category and rarity', () => {
    renderEntry();
    screen.getByText(/corundum/);
    screen.getByText(/Epic/);
  });

  it('shows physical and optical properties including a formatted RI range', () => {
    renderEntry();
    screen.getByText('1.762–1.770');
    screen.getByText('4.00');
    screen.getByText(/prismatic, tabular/);
    screen.getByText(/vitreous/);
    screen.getByText(/white/);
  });

  it('shows fluorescence per wave', () => {
    renderEntry();
    screen.getByText('LW red · SW none');
  });

  it('reports an inert species as inert', () => {
    renderEntry({ species: { ...RUBY, fluorescence: null } });
    screen.getByText(/Inert/i);
  });

  it('names the phenomenon and the cut that reveals it', () => {
    renderEntry();
    const phenomenon = screen.getByText(/asterism/i);
    expect(phenomenon.textContent).toMatch(/Cabochon/);
  });

  it('shows lapidary data: value, difficulty and named cuts', () => {
    renderEntry();
    screen.getByText(/900/);
    screen.getByText(/Step \/ Emerald Cut/);
  });

  it('names unlocked localities and hides locked ones', () => {
    renderEntry();
    screen.getByText(/Mogok Marble/);
    expect(screen.queryByText(/Secret Pipe/)).toBeNull();
    screen.getByText(/1 locked/);
  });

  it('shows real world locations and the fun fact', () => {
    renderEntry();
    screen.getByText(/Myanmar/);
    screen.getByText(/same mineral/);
  });

  it('shows a prompt when there is no trophy yet', () => {
    renderEntry();
    screen.getByText(/no cut stone yet/i);
  });

  it('shows the best cut stone when one exists', () => {
    renderEntry({ best: { cut: 'cabochon', score: 812, phenomena: ['asterism'] } });
    screen.getByText(/812/);
  });

  it('closes on the close button', () => {
    const { onClose } = renderEntry();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const { onClose } = renderEntry();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
