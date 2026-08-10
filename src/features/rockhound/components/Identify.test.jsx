import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Identify from './Identify.jsx';
import { speciesById } from '../../../loaders/species.js';
import { localitiesById } from '../../../loaders/localities.js';

// foundDepth: 3, not 1 as the brief originally specified — ruby's minDepth at
// mogok_marble is 3 (see localities.yaml), so a foundDepth: 1 ruby cannot
// exist: seedCandidates would exclude ruby from its own candidate pool,
// falsely narrowing "still consistent with" to spinel alone before any test
// even runs. RockhoundContext.test.js's REVEAL_TRAIT fixture already carries
// the same fix with the same comment.
const RUBY = {
  instanceId: 'r1', trueSpeciesId: 'ruby', origin: 'mogok_marble',
  foundDepth: 3, hue: 'red', revealed: {}
};

function renderIdentify(over = {}) {
  const props = {
    specimen: RUBY,
    locality: localitiesById.mogok_marble,
    speciesById,
    onReveal: vi.fn(),
    ...over
  };
  render(<Identify {...props} />);
  return props;
}

describe('Identify', () => {
  it('shows what each test will tell you before you press it', () => {
    // The whole point: no button is ever pressed blind.
    renderIdentify();
    screen.getByText(/Scratch Test/i);
    screen.getByText(/Heft in Water/i);
    screen.getByText(/UV Light/i);
  });

  it('marks unmeasured traits as unmeasured', () => {
    renderIdentify();
    expect(screen.getAllByText(/not measured/i).length).toBeGreaterThan(0);
  });

  it('shows the free observations without a test button', () => {
    renderIdentify();
    expect(screen.getByLabelText(/^Hue/i).textContent).toMatch(/red/i);
    expect(screen.queryByRole('button', { name: /measure hue/i })).toBeNull();
  });

  it('shows a measured reading with its value and uncertainty', () => {
    renderIdentify({
      specimen: { ...RUBY, revealed: { scratch: { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 0.5 } } }
    });
    expect(screen.getByLabelText(/^Scratch Test/i).textContent).toMatch(/9/);
    expect(screen.getByLabelText(/^Scratch Test/i).textContent).toMatch(/0\.5/);
  });

  it('names who is still in the running', () => {
    renderIdentify();
    const running = screen.getByLabelText(/still consistent/i).textContent;
    expect(running).toMatch(/Ruby/);
    expect(running).toMatch(/Spinel/);
  });

  it('reveals a trait by hand when its test is pressed', () => {
    const { onReveal } = renderIdentify();
    fireEvent.click(screen.getByRole('button', { name: /measure scratch test/i }));
    expect(onReveal).toHaveBeenCalledWith('scratch', true);
  });

  it('runs every remaining test at once, at reduced precision', () => {
    const { onReveal } = renderIdentify();
    fireEvent.click(screen.getByRole('button', { name: /run all tests/i }));
    expect(onReveal).toHaveBeenCalledTimes(3);
    // byHand false — the shortcut trades precision for speed.
    expect(onReveal.mock.calls.every((c) => c[1] === false)).toBe(true);
  });

  it('does not offer to re-run a test that has nothing left to measure', () => {
    const all = {
      scratch: { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 0.5 },
      heft: { testId: 'heft', kind: 'numeric', property: 'specificGravity', center: 4, band: 0.3 },
      uv: { testId: 'uv', kind: 'categorical', property: 'fluorescence', key: 'red/none' }
    };
    const { onReveal } = renderIdentify({ specimen: { ...RUBY, revealed: all } });
    fireEvent.click(screen.getByRole('button', { name: /run all tests/i }));
    expect(onReveal).not.toHaveBeenCalled();
  });

  it('explains a fully measured stone that still has not resolved', () => {
    // 23% of stones cannot resolve at low mastery even with everything
    // measured, because a beginner's bands are ten times too wide. Without
    // this message the player measures everything, sees nothing happen, and
    // concludes the game is broken.
    const all = {
      scratch: { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 5 },
      heft: { testId: 'heft', kind: 'numeric', property: 'specificGravity', center: 4, band: 3 },
      uv: { testId: 'uv', kind: 'categorical', property: 'fluorescence', key: 'inert' }
    };
    renderIdentify({ specimen: { ...RUBY, hue: 'red', revealed: all } });
    screen.getByText(/too imprecise to separate/i);
  });

  it('says nothing about imprecision while tests remain unrun', () => {
    // The message must mean "your readings are too wide", not "you have not
    // finished" — otherwise it fires on every fresh stone and means nothing.
    renderIdentify();
    expect(screen.queryByText(/too imprecise to separate/i)).toBeNull();
  });

  it('still offers a single test again, since a sharper reading is worth taking', () => {
    renderIdentify({
      specimen: { ...RUBY, revealed: { scratch: { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 0.5 } } }
    });
    screen.getByRole('button', { name: /measure scratch test/i });
  });
});
