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
    screen.getByText('Hidden Creek');
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
});
