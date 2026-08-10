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

  it('panning then switching to Identify shows a rough to work on', () => {
    renderRockhound();
    // The map and the run are separate screens now: pick the locality to
    // open the run screen, then work the gravel to start a dive; banking
    // the haul is what actually lands a specimen on the bench for Identify.
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek,/ }));
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    // The consistent-with readout proves an Identify session is active on a real rough.
    screen.getByLabelText(/still consistent/i);
  });

  it('shows an empty-bench prompt in Identify when there is no rough', () => {
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    screen.getByText(/no rough/i);
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
    // The bench readout is the shell's own, so this proves the dispatch landed.
    expect(screen.getByText(/Unidentified rough on your bench/i).textContent).toMatch(/1/);
  });

  it('carries a banked stone through to Identify', () => {
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek,/ }));
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Identify' }));
    // A depth-1 stone from Hidden Creek can be one of three shallow species
    // (quartz, almandine garnet, sapphire) but never the deep-only topaz
    // (minDepth: 2 in localities.yaml). The exact "still consistent with"
    // count now also depends on the specimen's randomly-rolled hue (a free
    // observation folded in immediately), so it can be narrower than 3 — but
    // it must never include the depth-unreachable topaz.
    expect(screen.getByLabelText(/still consistent/i).textContent).not.toMatch(/Topaz/);
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
    expect(screen.getByLabelText(/bench/i).textContent).toMatch(/1/);
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
