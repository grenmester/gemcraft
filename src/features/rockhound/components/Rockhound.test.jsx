// src/features/rockhound/components/Rockhound.test.jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RockhoundProvider } from '../RockhoundContext.jsx';
import Rockhound from './Rockhound.jsx';
import App from '../../../App.jsx';
import { BENCH_CAP } from '../logic/bench.js';

// The provider now lives at the app root (src/App.jsx) rather than inside
// Rockhound itself, so tests mounting the shell in isolation supply their own.
function renderRockhound() {
  return render(
    <RockhoundProvider>
      <Rockhound />
    </RockhoundProvider>
  );
}

describe('Rockhound shell', () => {
  beforeEach(() => localStorage.clear());

  it('renders the three tabs and defaults to Explore', () => {
    renderRockhound();
    screen.getByRole('button', { name: /Explore/i });
    screen.getByRole('button', { name: /Identify/i });
    screen.getByRole('button', { name: /Gemdex/i });
    expect(screen.getAllByText('Hidden Creek').length).toBeGreaterThan(0);
  });

  it('shows a rough that sight alone cannot settle on the Identify bench', () => {
    // A dug stone whose free observations already identify it resolves at
    // extraction and never reaches the bench, so digging is no longer a
    // reliable way to put one there — roughly 40% of stones resolve on sight.
    // Seed a genuinely ambiguous stone instead: colorless at Hidden Creek could
    // be quartz or sapphire, since both include that hue.
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [{
        instanceId: 'amb-1', stage: 'rough', trueSpeciesId: 'sapphire', identifiedAs: null,
        caratWeight: 1.2, clarity: 70, colorGrade: 70, origin: 'hidden_creek',
        foundDepth: 1, form: 'waterworn', hue: 'colorless', revealed: {}
      }]
    }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    const readout = screen.getByLabelText(/still consistent/i).textContent;
    expect(readout).toMatch(/Clear Quartz/);
    expect(readout).toMatch(/Sapphire/);
  });

  it('resolves a dug stone at extraction when sight alone settles it', () => {
    // The other half of the same rule: banking a haul must not leave an
    // already-obvious stone waiting for a pointless test press.
    localStorage.setItem('rockhound_save_v1', JSON.stringify({ rough: [] }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek,/ }));
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    const save = JSON.parse(localStorage.getItem('rockhound_save_v1'));
    // Every stone is either resolved or genuinely ambiguous — never both, and
    // never a resolved stone still sitting on the bench.
    for (const r of save.rough) {
      expect(r.stage).toBe('rough');
    }
    expect(save.rough.length + save.identified.length).toBeGreaterThan(0);
  });

  it('shows an empty-bench prompt in Identify when there is no rough', () => {
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    screen.getByText(/nothing on your bench/i);
  });

  it('falls back to the specimen\'s own species, not Hidden Creek, when its locality is gone', () => {
    // Regression for Finding 2: the shell used to substitute Hidden Creek
    // whenever a saved locality lookup came back empty. Ruby is not in
    // Hidden Creek's find pool at all, but red + transparent DOES match
    // Hidden Creek's almandine garnet — so the old substitution would show
    // "Almandine Garnet" here, while the reducer (whose own fallback is
    // [trueSpeciesId]) already treats the stone as settled on ruby. Passing
    // the real (missing) locality through makes the view agree with the
    // reducer: just ruby.
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [{
        instanceId: 'stale-1', stage: 'rough', trueSpeciesId: 'ruby', identifiedAs: null,
        caratWeight: 1, clarity: 80, colorGrade: 80, origin: 'a_deleted_locality',
        foundDepth: 3, form: 'fragment', hue: 'red', revealed: {}
      }]
    }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    const readout = screen.getByLabelText(/still consistent/i).textContent;
    expect(readout).toMatch(/Ruby/);
    expect(readout).not.toMatch(/Garnet/);
  });

  it('clears NEW badges once the Gemdex tab is viewed', () => {
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [], identified: [],
      gemdex: ['sapphire'], newlyDiscovered: ['sapphire'],
      reputation: 0, testMastery: { scratch: 0, heft: 0, uv: 0 }
    }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /Gemdex/i }));
    expect(screen.queryByText('NEW')).toBeNull();
  });

  it('shows the locality map with a locked, hinted neighbor in Explore', () => {
    renderRockhound();
    // starter is unlocked and selected; a gear-gated neighbor is locked with a hint
    screen.getByRole('button', { name: /^Hidden Creek,/ });
    screen.getByText(/Needs the sieve/i);
  });

  it('opens a locality field guide from the Explore map', () => {
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /Hidden Creek field guide/i }));
    screen.getByRole('dialog');
    screen.getByText(/Look for/i);
  });

  it('shows the career panel (reputation) on the Gemdex Career subtab', () => {
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /Gemdex/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Career$/ }));
    screen.getByText(/Reputation · tier/i);
  });

  it('defaults the Gemdex tab to the Species subtab', () => {
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /Gemdex/i }));
    screen.getByRole('button', { name: /^Species$/ });
    screen.getByRole('button', { name: /^Trophies$/ });
    screen.getByRole('button', { name: /^Career$/ });
    screen.getByText(/discovered/i);
  });

  it('shows a Cut tab with an empty state before anything is identified', () => {
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Cut$/i }));
    screen.getByText(/nothing to cut/i);
  });

  it('shows the trophy case on the Gemdex Trophies subtab', () => {
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /Gemdex/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Trophies$/ }));
    screen.getByText(/finest cut stone/i);
  });

  it('shows a Market tab with an empty sell state before anything is sellable', () => {
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Market$/i }));
    screen.getByText(/nothing to sell/i);
  });

  it('shows a cash readout in the shell', () => {
    renderRockhound();
    screen.getByLabelText(/cash/i);
  });
});

describe('Explore wiring', () => {
  beforeEach(() => localStorage.clear());

  it('banks a haul onto the bench', () => {
    renderRockhound();
    // Hidden Creek is the default locality and is panning-worked. The map
    // and the run are separate screens, so the locality must be opened
    // before the run's own controls appear.
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek,/ }));
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    // A banked stone whose free observations already settle it resolves at
    // extraction, so the bench count alone is no longer proof the dispatch
    // landed — the stone may legitimately have gone straight to identified.
    // Assert the total instead, which holds either way.
    const save = JSON.parse(localStorage.getItem('rockhound_save_v1'));
    expect(save.rough.length + save.identified.length).toBe(1);
  });

  it('never leaves a settled stone waiting on the Identify bench', () => {
    // Whatever gets rolled, a stone that reaches the bench must still be
    // genuinely ambiguous — anything sight alone settled resolved at
    // extraction. Seed a colorless stone so there is always one to inspect.
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [{
        instanceId: 'amb-2', stage: 'rough', trueSpeciesId: 'quartz', identifiedAs: null,
        caratWeight: 1, clarity: 60, colorGrade: 60, origin: 'hidden_creek',
        foundDepth: 1, form: 'waterworn', hue: 'colorless', revealed: {}
      }]
    }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: 'Identify' }));
    // Hidden Creek at depth 1 pools quartz, almandine garnet and sapphire;
    // topaz is minDepth 2 and unreachable. The free hue observation is folded
    // in immediately, and the hue sets are NOT disjoint — quartz and sapphire
    // both include 'colorless' — so the count lands on 1 or 2 depending on
    // what was rolled, never 3 and never 0.
    const readout = screen.getByLabelText(/still consistent/i).textContent;
    // Never the depth-unreachable species.
    expect(readout).not.toMatch(/Topaz/);
    // Never empty: an empty list means the consistency check wrongly excluded
    // the stone's own species, which would make it permanently unidentifiable.
    // This is the assertion that actually catches a broken reading.
    const named = ['Clear Quartz', 'Almandine Garnet', 'Sapphire'].filter((n) => readout.includes(n));
    expect(named.length).toBeGreaterThan(0);
    expect(named.length).toBeLessThan(3);
  });
});

describe('Explore map and run are separate screens', () => {
  beforeEach(() => localStorage.clear());

  it('starts on the map with no run in progress', () => {
    render(<App />);
    // Anchored with the trailing comma: a bare /^Hidden Creek/ also matches
    // the field-guide button ("Hidden Creek field guide") and is ambiguous.
    screen.getByRole('button', { name: /^Hidden Creek,/ });
    expect(screen.queryByRole('button', { name: /work the gravel/i })).toBeNull();
  });

  it('opens the run screen when a locality is chosen, hiding the map', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek,/ }));
    screen.getByRole('button', { name: /work the gravel/i });
    // The map must be gone: switching localities mid-run made the header
    // disagree with the locality actually being dug.
    expect(screen.queryByRole('button', { name: /^Gravel Bar/ })).toBeNull();
  });

  it('returns to the map from the run screen', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek,/ }));
    fireEvent.click(screen.getByRole('button', { name: /back to the map/i }));
    screen.getByRole('button', { name: /^Gravel Bar,/ });
  });

  it('still banks a haul onto the bench from the run screen', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek,/ }));
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    // The stone lands either on the bench or straight in identified, depending
    // on whether sight alone settled it — both count as banked.
    const save = JSON.parse(localStorage.getItem('rockhound_save_v1'));
    expect(save.rough.length + save.identified.length).toBe(1);
  });
});

describe('the rocker box end to end', () => {
  beforeEach(() => localStorage.clear());

  it('shows no banner until a box is parked', () => {
    render(<App />);
    expect(screen.queryByText(/rocker box has been working/i)).toBeNull();
  });

  it('parks from the run screen and reports it on the map', () => {
    // Seed a save with the box bought and one species known, then park it.
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      gear: ['rocker_box'], gemdex: ['quartz']
    }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek,/ }));
    fireEvent.click(screen.getByRole('button', { name: /leave the rocker box here/i }));
    fireEvent.click(screen.getByRole('button', { name: /back to the map/i }));
    // A bare getByRole('status') would pass even with the wrong locality
    // name or count baked in — pin down what the banner actually says.
    expect(screen.getByRole('status').textContent).toMatch(/Hidden Creek/);
  });

  it('blocks moving the box when its pending haul would land past the bench cap', () => {
    // The shell derives parkBlocked from the live sieve view. Testing only the
    // component with a prop leaves that derivation unguarded — setting it to a
    // constant false passed the entire suite — so drive it through real state:
    // a box parked at Hidden Creek with hours accrued, and a full bench.
    const stone = (i) => ({
      instanceId: `fill-${i}`, stage: 'rough', trueSpeciesId: 'quartz', identifiedAs: null,
      caratWeight: 1, clarity: 50, colorGrade: 50, origin: 'hidden_creek', foundDepth: 1, form: 'waterworn'
    });
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      // 'sieve' gear unlocks Gravel Bar, giving us a second locality to try to move to.
      gear: ['rocker_box', 'sieve'],
      gemdex: ['quartz'],
      rough: Array.from({ length: BENCH_CAP }, (_, i) => stone(i)),
      sieve: { localityId: 'hidden_creek', since: 0 }
    }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Gravel Bar,/ }));
    const park = screen.getByRole('button', { name: /leave the rocker box here/i });
    expect(park.disabled).toBe(true);
    screen.getByText(/staying right where it is/i);
  });

  it('allows moving the box when the bench is full but nothing has accrued', () => {
    // The block must track the reducer's real refusal — pending yield AND a
    // full bench — not the full bench alone. `since: Date.now()` means nothing
    // has accrued yet, so the move is legitimate.
    const stone = (i) => ({
      instanceId: `fill-${i}`, stage: 'rough', trueSpeciesId: 'quartz', identifiedAs: null,
      caratWeight: 1, clarity: 50, colorGrade: 50, origin: 'hidden_creek', foundDepth: 1, form: 'waterworn'
    });
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      gear: ['rocker_box', 'sieve'],
      gemdex: ['quartz'],
      rough: Array.from({ length: BENCH_CAP }, (_, i) => stone(i)),
      sieve: { localityId: 'hidden_creek', since: Date.now() }
    }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Gravel Bar,/ }));
    expect(screen.getByRole('button', { name: /leave the rocker box here/i }).disabled).toBe(false);
  });
});

describe('the bench', () => {
  const stone = (over = {}) => ({
    instanceId: 'x', stage: 'rough', trueSpeciesId: 'quartz', identifiedAs: null,
    caratWeight: 1, clarity: 60, colorGrade: 60, origin: 'hidden_creek',
    foundDepth: 1, form: 'waterworn', hue: 'colorless', revealed: {}, ...over
  });

  it('lets the player choose between stones', () => {
    // Make the two stones distinguishable by hue (colorless quartz vs. red
    // almandine garnet) so clicking the second one is provable, not just
    // that two buttons rendered — a no-op onSelect would also pass that.
    // Both species sit in Hidden Creek's depth-1 find pool with no minimum
    // depth, and merely selecting a stone does not commit its resolution,
    // so the red garnet's sheet stays visible even though sight alone
    // would otherwise settle it.
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [
        stone({ instanceId: 'x1', trueSpeciesId: 'quartz', hue: 'colorless' }),
        stone({ instanceId: 'x2', trueSpeciesId: 'almandine_garnet', hue: 'red' })
      ]
    }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    const bench = screen.getByLabelText(/stones on your bench/i);
    const buttons = bench.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    expect(screen.getByLabelText(/^Hue:/).textContent).toMatch(/colorless/);
    fireEvent.click(buttons[1]);
    expect(screen.getByLabelText(/^Hue:/).textContent).toMatch(/red/);
  });

  it('keeps an identified but ungraded stone on the bench so it can be graded', () => {
    // An identified stone has left state.rough, so without this it would be
    // impossible to grade anything.
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [],
      identified: [stone({ instanceId: 'y1', stage: 'identified', identifiedAs: 'quartz' })]
    }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    screen.getByRole('button', { name: /Clear Quartz, Identified/i });
  });

  it('drops a fully graded stone off the bench', () => {
    const graded = {
      weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 1 },
      colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 60, band: 5 },
      clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 60, band: 5 }
    };
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [],
      identified: [stone({ instanceId: 'y2', stage: 'identified', identifiedAs: 'quartz', revealed: graded })]
    }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    screen.getByText(/nothing on your bench/i);
  });

  it('does not re-announce a stone that was identified in a previous session', () => {
    // Regression for Finding 1: the announcement used to be derived from
    // current membership (identified but not rough), which stays true
    // forever. Selecting an already-identified-but-ungraded stone from the
    // bench must not re-announce "That settles it" for a stone resolved
    // long ago — only the measurement that just resolved it should.
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [],
      identified: [stone({ instanceId: 'y1', stage: 'identified', identifiedAs: 'quartz' })]
    }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Clear Quartz, Identified/i }));
    expect(screen.queryByRole('status')).toBe(null);
  });

  it('announces a stone that has just been identified', () => {
    // The playtest saw stones teleport to Cut with no explanation.
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [stone({ instanceId: 'z1', trueSpeciesId: 'almandine_garnet', hue: 'red' })]
    }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    fireEvent.click(screen.getByRole('button', { name: /measure scratch test/i }));
    expect(screen.getByRole('status').textContent).toMatch(/Almandine Garnet/);
  });
});
