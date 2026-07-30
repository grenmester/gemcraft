import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Cut from './Cut.jsx';
import { speciesById } from '../../../loaders/species.js';
import { cutTechniques } from '../../../loaders/cutTechniques.js';
import { cutSuccessProbability } from '../logic/cut.js';

const RUBY_ROUGH = { instanceId: 'i1', stage: 'identified', trueSpeciesId: 'ruby', caratWeight: 1.8, clarity: 82, colorGrade: 91, origin: 'mogok_marble' };
const TOPAZ_ROUGH = { instanceId: 'i2', stage: 'identified', trueSpeciesId: 'topaz', caratWeight: 2.0, clarity: 70, colorGrade: 60, origin: 'old_quarry' };

function renderCut(overrides = {}) {
  const props = {
    identified: [RUBY_ROUGH, TOPAZ_ROUGH],
    techniques: cutTechniques,
    cutTechniqueLevel: { cabochon: 4, princess: 1 },
    speciesById,
    selectedId: 'i1',
    onSelectSpecimen: vi.fn(),
    onUnlock: vi.fn(),
    onLevel: vi.fn(),
    onApply: vi.fn(),
    ...overrides
  };
  render(<Cut {...props} />);
  return props;
}

describe('Cut', () => {
  it('prompts when there is nothing to cut', () => {
    renderCut({ identified: [] });
    screen.getByText(/nothing to cut/i);
  });

  it('lists the stones on the bench and lets one be picked', () => {
    const { onSelectSpecimen } = renderCut();
    fireEvent.click(screen.getByRole('button', { name: /^Topaz,/ }));
    expect(onSelectSpecimen).toHaveBeenCalledWith('i2');
  });

  it('shows the selected stone measurements so the choice is informed', () => {
    renderCut();
    expect(screen.getByText('Carat').closest('div').textContent).toMatch(/1\.8 ct/);
    expect(screen.getByText('Colour').closest('div').textContent).toMatch(/91/);
    expect(screen.getByText('Clarity').closest('div').textContent).toMatch(/82/);
  });

  it('shows the TRUE success odds, not the technique base rate', () => {
    renderCut();
    const truth = Math.round(cutSuccessProbability(speciesById.ruby, cutTechniques.find((t) => t.id === 'cabochon'), 4) * 100);
    screen.getByText(`${truth}%`);
    // the bare curve value (76%) must not be what we display
    expect(truth).toBeLessThan(76);
    expect(screen.queryByText('76%')).toBeNull();
  });

  it('advertises the phenomenon a cut would reveal', () => {
    renderCut();
    screen.getByText(/asterism/i);
  });

  it('warns when a cut can shatter the selected stone', () => {
    // topaz has perfect cleavage; princess is catastrophic
    renderCut({ selectedId: 'i2' });
    screen.getByText(/can shatter/i);
  });

  it('does not warn about shattering a stone that cannot cleave', () => {
    renderCut({ selectedId: 'i1' }); // ruby, cleavage none
    expect(screen.queryByText(/can shatter/i)).toBeNull();
  });

  it('explains why an unsuitable technique cannot be used', () => {
    renderCut({ selectedId: 'i2' }); // topaz takes only round brilliant, step and princess
    const cabochonCard = screen.getByRole('button', { name: /About Cabochon/i }).closest('li');
    expect(cabochonCard.textContent).toMatch(/does not take this cut/i);
  });

  it('applies a cut with the selected stone and technique', () => {
    const { onApply } = renderCut();
    fireEvent.click(screen.getByRole('button', { name: /Cut it with Cabochon/i }));
    expect(onApply).toHaveBeenCalledWith('i1', 'cabochon');
  });

  it('offers Learn for an unlearned technique and Practice for a learned one', () => {
    const { onUnlock, onLevel } = renderCut();
    fireEvent.click(screen.getByRole('button', { name: /Learn Step/i }));
    expect(onUnlock).toHaveBeenCalledWith('step');
    fireEvent.click(screen.getByRole('button', { name: /Practice Cabochon/i }));
    expect(onLevel).toHaveBeenCalledWith('cabochon');
  });

  it('opens a technique guide and closes it again', () => {
    renderCut();
    fireEvent.click(screen.getByRole('button', { name: /About Cabochon/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /close entry/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not show a last-cut result readout', () => {
    renderCut();
    expect(screen.queryByText(/last cut/i)).toBeNull();
  });
});
