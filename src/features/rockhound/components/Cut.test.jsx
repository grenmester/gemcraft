import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Cut from './Cut.jsx';
import { speciesById } from '../../../loaders/species.js';
import { cutTechniques } from '../../../loaders/cutTechniques.js';

const identified = [
  { instanceId: 'g1', trueSpeciesId: 'sapphire', identifiedAs: 'sapphire', caratWeight: 2, clarity: 80, colorGrade: 80, origin: 'hidden_creek' }
];

function setup(over = {}) {
  const props = {
    identified,
    techniques: cutTechniques,
    cutTechniqueLevel: {},
    speciesById,
    selectedId: 'g1',
    onSelectSpecimen: vi.fn(),
    lastCutResult: null,
    onUnlock: vi.fn(),
    onLevel: vi.fn(),
    onApply: vi.fn(),
    ...over
  };
  render(<Cut {...props} />);
  return props;
}

describe('Cut', () => {
  it('shows an empty state when there is nothing identified', () => {
    setup({ identified: [] });
    screen.getByText(/nothing to cut/i);
  });

  it('offers Learn for a locked technique and unlocks it', () => {
    const p = setup();
    fireEvent.click(screen.getAllByRole('button', { name: /Learn/i })[0]);
    expect(p.onUnlock).toHaveBeenCalled();
  });

  it('offers Apply only for a suitable, unlocked technique', () => {
    const p = setup({ cutTechniqueLevel: { cabochon: 3 } }); // sapphire suitableCuts includes cabochon
    fireEvent.click(screen.getByRole('button', { name: /Apply/i }));
    expect(p.onApply).toHaveBeenCalledWith('g1', 'cabochon');
  });

  it('renders the last cut result with a revealed phenomenon', () => {
    setup({ lastCutResult: { instanceId: 'g1', outcome: 'success', speciesId: 'sapphire', cutQuality: 92, phenomena: ['asterism'] } });
    screen.getByText(/asterism/i);
  });

  it('pre-selects the first identified specimen when none is chosen, enabling Apply', () => {
    const p = setup({ selectedId: null, cutTechniqueLevel: { cabochon: 3 } });
    fireEvent.click(screen.getByRole('button', { name: /Apply/i }));
    expect(p.onApply).toHaveBeenCalledWith('g1', 'cabochon');
  });

  it('Learn unlocks the specific technique clicked (first is cabochon)', () => {
    const p = setup();
    fireEvent.click(screen.getAllByRole('button', { name: /Learn/i })[0]);
    expect(p.onUnlock).toHaveBeenCalledWith('cabochon');
  });
});
