import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusFooter from './StatusFooter.jsx';
import { xpThreshold } from '../../domain/dive.js';
import { BENCH_CAP } from '../../domain/bench.js';

const props = {
  cash: 1234,
  roughCount: 3,
  identifiedCount: 2,
  stoneCount: 1,
  gemdexFound: 7,
  gemdexTotal: 21,
  exploreMethodXp: { panning: xpThreshold(4), hardrock: 0, geode: 0, surface: 0 }
};

describe('StatusFooter', () => {
  it('shows the money the Market actually spends', () => {
    render(<StatusFooter {...props} />);
    expect(screen.getByLabelText(/cash/i).textContent).toMatch(/1,234/);
  });

  it('shows all four tracks at once, including the untouched ones', () => {
    render(<StatusFooter {...props} />);
    for (const m of ['panning', 'hardrock', 'geode', 'surface']) {
      screen.getByLabelText(new RegExp(`${m} level`, 'i'));
    }
  });

  it('says what depth a track currently reaches', () => {
    render(<StatusFooter {...props} />);
    // panning at level 4 reaches depth 3; a fresh track reaches 1.
    expect(screen.getByLabelText(/panning level/i).textContent).toMatch(/3/);
    expect(screen.getByLabelText(/geode level/i).textContent).toMatch(/1/);
  });

  it('shows what is on the bench and in the Gemdex', () => {
    render(<StatusFooter {...props} />);
    expect(screen.getByLabelText(/bench/i).textContent).toMatch(/3/);
    expect(screen.getByLabelText(/gemdex/i).textContent).toMatch(/7/);
  });

  it('shows the bench against its cap, so the limit is visible before it bites', () => {
    render(<StatusFooter {...props} />);
    expect(screen.getByLabelText(/bench/i).textContent).toMatch(new RegExp(`/${BENCH_CAP}`));
  });
});
