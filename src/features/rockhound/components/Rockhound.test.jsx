// src/features/rockhound/components/Rockhound.test.jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RockhoundProvider } from '../RockhoundContext.jsx';
import Rockhound from './Rockhound.jsx';

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
    // Working the gravel starts a dive; banking the haul is what actually
    // lands a specimen on the bench for Identify to see.
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    // A suspects counter proves an Identify session is active on a real rough.
    screen.getByText(/SUSPECTS:/);
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
    screen.getByText(/💰/);
  });
});

describe('Explore wiring', () => {
  beforeEach(() => localStorage.clear());

  it('banks a haul onto the bench', () => {
    renderRockhound();
    // Hidden Creek is the default locality and is panning-worked.
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    // The bench readout is the shell's own, so this proves the dispatch landed.
    expect(screen.getByText(/Unidentified rough on your bench/i).textContent).toMatch(/1/);
  });

  it('carries a banked stone through to Identify', () => {
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Identify' }));
    // A depth-1 stone from Hidden Creek can be any of the three shallow
    // species (quartz, almandine garnet, sapphire), but never the deep-only
    // topaz (minDepth: 2 in localities.yaml).
    expect(screen.getByText(/SUSPECTS/).textContent).toMatch(/3/);
  });
});
