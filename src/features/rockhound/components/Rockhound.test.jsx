// src/features/rockhound/components/Rockhound.test.jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Rockhound from './Rockhound.jsx';

describe('Rockhound shell', () => {
  beforeEach(() => localStorage.clear());

  it('renders the three tabs and defaults to Explore', () => {
    render(<Rockhound />);
    screen.getByRole('button', { name: /Explore/i });
    screen.getByRole('button', { name: /Identify/i });
    screen.getByRole('button', { name: /Gemdex/i });
    expect(screen.getAllByText('Hidden Creek').length).toBeGreaterThan(0);
  });

  it('panning then switching to Identify shows a rough to work on', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /Pan the/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    // A suspects counter proves an Identify session is active on a real rough.
    screen.getByText(/SUSPECTS:/);
  });

  it('shows an empty-bench prompt in Identify when there is no rough', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    screen.getByText(/no rough/i);
  });

  it('clears NEW badges once the Gemdex tab is viewed', () => {
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [], identified: [],
      gemdex: ['sapphire'], newlyDiscovered: ['sapphire'],
      reputation: 0, testMastery: { scratch: 0, heft: 0, uv: 0 }
    }));
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /Gemdex/i }));
    expect(screen.queryByText('NEW')).toBeNull();
  });

  it('shows the locality map with a locked, hinted neighbor in Explore', () => {
    render(<Rockhound />);
    // starter is unlocked and selected; a gear-gated neighbor is locked with a hint
    screen.getByRole('button', { name: /Hidden Creek/i });
    screen.getByText(/Needs the sieve/i);
  });

  it('shows the career panel (reputation) on the Gemdex Career subtab', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /Gemdex/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Career$/ }));
    screen.getByText(/Reputation · tier/i);
  });

  it('defaults the Gemdex tab to the Species subtab', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /Gemdex/i }));
    screen.getByRole('button', { name: /^Species$/ });
    screen.getByRole('button', { name: /^Trophies$/ });
    screen.getByRole('button', { name: /^Career$/ });
    screen.getByText(/discovered/i);
  });

  it('shows a Cut tab with an empty state before anything is identified', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /^Cut$/i }));
    screen.getByText(/nothing to cut/i);
  });

  it('shows the trophy case on the Gemdex Trophies subtab', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /Gemdex/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Trophies$/ }));
    screen.getByText(/finest cut stone/i);
  });

  it('shows a Market tab with an empty sell state before anything is sellable', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /^Market$/i }));
    screen.getByText(/nothing to sell/i);
  });

  it('shows a cash readout in the shell', () => {
    render(<Rockhound />);
    screen.getByText(/💰/);
  });
});
