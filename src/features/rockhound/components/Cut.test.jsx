import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Cut from './Cut.jsx';
import { speciesById } from '../../../data/species/loader.js';
import { cutTechniques } from '../../../data/cutTechniques/loader.js';
import { cutSuccessProbability } from '../../../domain/cut.js';

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
    // Meters only ever show what has actually been measured, so this fixture
    // needs a full revealed record — a stone the player has fully graded —
    // rather than relying on the true (unmeasured) values Cut used to trust.
    const graded = {
      ...RUBY_ROUGH,
      revealed: {
        weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 1.8 },
        colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 91, band: 5 },
        clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 82, band: 5 }
      }
    };
    renderCut({ identified: [graded, TOPAZ_ROUGH] });
    expect(screen.getByText('Weigh').closest('div').textContent).toMatch(/1\.8 ct/);
    expect(screen.getByText('Colour').closest('div').textContent).toMatch(/91/);
    expect(screen.getByText('Clarity').closest('div').textContent).toMatch(/82/);
  });

  it('does not show a quality the player has never measured', () => {
    // The playtest asked why Cut's stats did not match the tests run in
    // Identify. They must never appear as though they were known.
    // RUBY_ROUGH and TOPAZ_ROUGH carry no revealed, so every quality trait
    // reads as unmeasured here.
    renderCut();
    expect(screen.getAllByText(/not measured, so a buyer assumes the worst/i).length).toBeGreaterThan(0);
  });

  it('does not show the true carat in the tray for an unweighed rough stone', () => {
    // RUBY_ROUGH carries no revealed record, so its true carat (1.8) is
    // known only to the game, not the player. The tray row must not print
    // it, even though the row itself still needs to render.
    renderCut();
    const row = screen.getByRole('button', { name: /^Ruby,/ });
    expect(row.textContent).not.toMatch(/1\.8/);
    expect(row.textContent).toMatch(/Ruby/);
  });

  it('gives two unweighed same-species rough stones distinct tray aria-labels', () => {
    const rubyTwo = { ...RUBY_ROUGH, instanceId: 'i3', caratWeight: 3.4 };
    renderCut({ identified: [RUBY_ROUGH, rubyTwo], selectedId: 'i1' });
    const rows = screen.getAllByRole('button', { name: /^Ruby,/ });
    const labels = rows.map((r) => r.getAttribute('aria-label'));
    expect(new Set(labels).size).toBe(labels.length);
    // Neither label leaks the true (unmeasured) carat.
    expect(labels.some((l) => l.includes('1.8'))).toBe(false);
    expect(labels.some((l) => l.includes('3.4'))).toBe(false);
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

  it('does not quote odds or shatter risk in the guide for an unsuitable technique', () => {
    // topaz cannot take fancy; opening its guide must not show a real
    // percentage or a shatter warning, even though fancy is learned and
    // topaz cleaves (perfect cleavage) and fancy is catastrophicOnFail.
    renderCut({
      selectedId: 'i2',
      cutTechniqueLevel: { cabochon: 4, princess: 1, fancy: 3 }
    });
    fireEvent.click(screen.getByRole('button', { name: /About Fancy/i }));
    const dialog = screen.getByRole('dialog');
    // Keeps/Cut quality legitimately show a % regardless of suitability, so
    // scope the "no percentage" check to the Success row itself.
    expect(screen.getByText('Success').closest('div').textContent).not.toMatch(/%/);
    expect(dialog.textContent).not.toMatch(/shatter/i);
    expect(dialog.textContent).toMatch(/does not take this cut/i);
  });

  it('shows the TRUE success odds in the guide, not the bare curve value', () => {
    renderCut(); // ruby selected by default
    const truth = Math.round(cutSuccessProbability(speciesById.ruby, cutTechniques.find((t) => t.id === 'cabochon'), 4) * 100);
    fireEvent.click(screen.getByRole('button', { name: /About Cabochon/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toMatch(`${truth}%`);
    expect(truth).toBe(57);
    expect(dialog.textContent).not.toMatch('76%');
  });
});
