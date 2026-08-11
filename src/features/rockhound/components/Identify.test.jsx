import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Identify from './Identify.jsx';
import { speciesById } from '../../../loaders/species.js';
import { localitiesById } from '../../../loaders/localities.js';

const STONE = {
  instanceId: 'r1', trueSpeciesId: 'ruby', origin: 'mogok_marble', foundDepth: 3,
  hue: 'red', caratWeight: 2.4, colorGrade: 78, clarity: 64, revealed: {}
};

function renderIdentify(over = {}) {
  const props = {
    specimen: STONE, locality: localitiesById.mogok_marble, speciesById,
    identified: false, onReveal: vi.fn(), ...over
  };
  render(<Identify {...props} />);
  return props;
}

describe('the stone sheet', () => {
  it('says what each section is for, in plain language', () => {
    // The answer to "why don't Cut's stats match the tests": one kind of trait
    // identifies a stone, the other prices it.
    renderIdentify();
    // Plain language, not jargon: this labelling is the answer a playtester
    // wanted when they asked why Cut's stats did not match these tests.
    // Queried by heading role: the intro sentence above them explains the same
    // distinction in prose, so a bare getByText would match two elements.
    screen.getByRole('heading', { name: /what it is/i });
    screen.getByRole('heading', { name: /what it's worth/i });
  });

  it('offers every diagnostic test and every grading observation', () => {
    renderIdentify();
    for (const name of [/scratch test/i, /heft in water/i, /uv light/i, /weigh/i, /grade colour/i, /grade clarity/i]) {
      screen.getByRole('button', { name: new RegExp(`measure ${name.source}`, 'i') });
    }
  });

  it('marks an ungraded quality row as unmeasured', () => {
    renderIdentify();
    expect(screen.getByLabelText(/^Weigh/i).textContent).toMatch(/not measured/i);
  });

  it('shows an exact weight without a plus-or-minus', () => {
    renderIdentify({ specimen: { ...STONE, revealed: {
      weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 2.4 }
    } } });
    const row = screen.getByLabelText(/^Weigh/i).textContent;
    expect(row).toMatch(/2\.4/);
    expect(row).not.toMatch(/±/);
  });

  it('shows an uncertain grade with its plus-or-minus', () => {
    renderIdentify({ specimen: { ...STONE, revealed: {
      colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 78, band: 5 }
    } } });
    const row = screen.getByLabelText(/^Grade Colour/i).textContent;
    expect(row).toMatch(/78/);
    expect(row).toMatch(/±/);
  });

  it('shows which rung the stone has reached', () => {
    renderIdentify();
    expect(screen.getByLabelText(/rung/i).textContent).toMatch(/unidentified/i);
  });

  it('says a stone is identified but not yet graded', () => {
    renderIdentify({ identified: true });
    expect(screen.getByLabelText(/rung/i).textContent).toMatch(/identified/i);
  });

  it('measures a single trait by hand when its button is pressed', () => {
    const { onReveal } = renderIdentify();
    fireEvent.click(screen.getByRole('button', { name: /measure grade colour/i }));
    expect(onReveal).toHaveBeenCalledWith('colour', true);
  });

  it('runs everything unmeasured at once, grading included', () => {
    // If run-all skipped grading, this would add three presses per stone and
    // reintroduce the busywork the previous increment removed.
    const { onReveal } = renderIdentify();
    fireEvent.click(screen.getByRole('button', { name: /measure everything/i }));
    const ids = onReveal.mock.calls.map((c) => c[0]).sort();
    expect(ids).toEqual(['clarity', 'colour', 'heft', 'scratch', 'uv', 'weigh']);
    expect(onReveal.mock.calls.every((c) => c[1] === false)).toBe(true);
  });

  it('has nothing left to run once everything is measured', () => {
    const all = {
      scratch: { testId: 'scratch', axis: 'diagnostic', kind: 'numeric', property: 'hardness', center: 9, band: 0.5 },
      heft: { testId: 'heft', axis: 'diagnostic', kind: 'numeric', property: 'specificGravity', center: 4, band: 0.3 },
      uv: { testId: 'uv', axis: 'diagnostic', kind: 'categorical', property: 'fluorescence', key: 'red/none' },
      weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 2.4 },
      colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 78, band: 5 },
      clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 64, band: 5 }
    };
    renderIdentify({ specimen: { ...STONE, revealed: all } });
    expect(screen.getByRole('button', { name: /measure everything/i }).disabled).toBe(true);
  });

  it('names who is still in the running', () => {
    renderIdentify();
    const readout = screen.getByLabelText(/still consistent/i).textContent;
    expect(readout).toMatch(/Ruby/);
    expect(readout).toMatch(/Spinel/);
  });
});
