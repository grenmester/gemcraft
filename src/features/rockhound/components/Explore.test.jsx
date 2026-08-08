import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Explore from './Explore.jsx';
import { localities } from '../../../loaders/localities.js';
import { xpThreshold } from '../logic/dive.js';

const creek = localities.find((l) => l.id === 'hidden_creek');

function renderExplore(overrides = {}) {
  const props = {
    locality: creek,
    methodXp: 0,
    setComplete: false,
    roughCount: 0,
    onBank: vi.fn(),
    rng: () => 0.5,
    ...overrides
  };
  render(<Explore {...props} />);
  return props;
}

describe('Explore — before a run', () => {
  it('offers a single way in', () => {
    renderExplore();
    screen.getByRole('button', { name: /work the gravel/i });
    expect(screen.queryByRole('button', { name: /go deeper/i })).toBeNull();
  });

  it('shows a beginner no depth machinery even mid-run', () => {
    // The ramp's first rung: at level 0 Explore is one button, a haul, and
    // banking. Asserting this before the run starts would pass trivially.
    renderExplore({ methodXp: 0 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    expect(screen.queryByRole('button', { name: /go deeper/i })).toBeNull();
    screen.getByRole('button', { name: /bank this haul/i });
  });
});

describe('Explore — during a run', () => {
  it('reveals a haul and offers to bank it', () => {
    renderExplore();
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    screen.getByRole('button', { name: /bank this haul/i });
  });

  it('never names the species of unidentified rough', () => {
    // Naming it here would hand the player the answer Identify exists to ask.
    renderExplore({ methodXp: xpThreshold(4) });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    const haul = screen.getByRole('list', { name: /haul/i });
    for (const name of ['Quartz', 'Sapphire', 'Topaz', 'Almandine Garnet']) {
      expect(haul.textContent, `leaked ${name}`).not.toContain(name);
    }
  });

  it('offers the descent once the player can reach depth 2', () => {
    renderExplore({ methodXp: xpThreshold(2) });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    screen.getByRole('button', { name: /go deeper/i });
  });

  it('quotes the risk on the descent button', () => {
    renderExplore({ methodXp: xpThreshold(2) });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    const deeper = screen.getByRole('button', { name: /go deeper/i });
    expect(deeper.textContent).toMatch(/\d+%/);
  });

  it('adds to the haul when the descent holds', () => {
    // rng 0.99 never falls under a break chance of 0.13 at level 2.
    renderExplore({ methodXp: xpThreshold(2), rng: () => 0.99 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    const before = screen.getAllByRole('listitem').length;
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(before);
  });

  it('warns that the stakes change before a descent that can cost stones', () => {
    // Level 4 reaches depth 3; descending to 3 is where loss becomes real.
    renderExplore({ methodXp: xpThreshold(4), rng: () => 0.99 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));
    expect(screen.getByRole('status').textContent).toMatch(/lose/i);
  });
});

describe('Explore — when the shaft breaks', () => {
  it('ends the run and says so', () => {
    // rng 0 is below every non-zero break chance.
    renderExplore({ methodXp: xpThreshold(2), rng: () => 0 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));
    expect(screen.getByRole('alert').textContent).toMatch(/gave way|broke|collapsed/i);
    expect(screen.queryByRole('button', { name: /go deeper/i })).toBeNull();
  });

  it('still lets the player walk away with what survived', () => {
    const { onBank } = renderExplore({ methodXp: xpThreshold(2), rng: () => 0 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    expect(onBank).toHaveBeenCalledTimes(1);
    expect(onBank.mock.calls[0][0].specimens.length).toBeGreaterThan(0);
  });
});

describe('Explore — banking', () => {
  it('hands over the stones, the method and the experience earned', () => {
    const { onBank } = renderExplore({ methodXp: xpThreshold(2), rng: () => 0.99 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    const payload = onBank.mock.calls[0][0];
    expect(payload.method).toBe('panning');
    expect(payload.xp).toBe(30); // depths [1, 2] -> 10 + 20, no break
    expect(payload.specimens.length).toBeGreaterThan(1);
  });

  it('pays less experience for a run that broke', () => {
    const { onBank } = renderExplore({ methodXp: xpThreshold(2), rng: () => 0 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    expect(onBank.mock.calls[0][0].xp).toBe(5); // depths [1] -> 10, halved
  });

  it('returns to the start after banking', () => {
    renderExplore({ methodXp: xpThreshold(2), rng: () => 0.99 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    screen.getByRole('button', { name: /work the gravel/i });
    expect(screen.queryByRole('button', { name: /bank this haul/i })).toBeNull();
  });
});

describe('Explore — leaving', () => {
  it('offers a plain way back when no run is in progress', () => {
    renderExplore();
    screen.getByRole('button', { name: /back to the map/i });
  });

  it('warns that the haul is lost when leaving mid-run', () => {
    // Only bank() preserves a haul, so leaving mid-run genuinely discards it.
    // The control must say so rather than reading like a harmless back button.
    renderExplore();
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    expect(screen.queryByRole('button', { name: /back to the map/i })).toBeNull();
    const leave = screen.getByRole('button', { name: /leave run/i });
    expect(leave.textContent).toMatch(/lost/i);
  });

  it('hands control back to the caller when leaving', () => {
    const onLeave = vi.fn();
    renderExplore({ onLeave });
    fireEvent.click(screen.getByRole('button', { name: /back to the map/i }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });
});
