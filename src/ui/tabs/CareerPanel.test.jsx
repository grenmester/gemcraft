import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CareerPanel from './CareerPanel.jsx';

function renderPanel(overrides = {}) {
  render(
    <CareerPanel
      reputation={60}
      gear={['sieve']}
      familySetsComplete={2}
      familySetsTotal={15}
      localitySetsComplete={1}
      localitySetsTotal={10}
      {...overrides}
    />
  );
}

describe('CareerPanel', () => {
  it('explains itself', () => {
    renderPanel();
    screen.getByText(/standing/i);
  });

  it('shows reputation and its tier', () => {
    renderPanel();
    screen.getByText(/⭐ 60/);
    screen.getByText(/tier 1/i);
  });

  it('shows progress toward the next tier', () => {
    renderPanel();
    screen.getByText('60 / 120');
  });

  it('shows owned gear and locked milestones with their requirement', () => {
    renderPanel();
    screen.getByText(/Sieve/i);
    screen.getByText(/Rock Hammer/i);
    screen.getByText(/Complete the Hidden Creek set/i);
    screen.getByText(/owned/i);
  });

  it('shows set completion counts', () => {
    renderPanel();
    screen.getByText('2 / 15');
    screen.getByText('1 / 10');
  });

  it('lists gear bought outside the milestone track', () => {
    renderPanel({ gear: ['sieve', 'loupe'] });
    screen.getByText(/loupe/i);
    screen.getByText(/bought/i);
  });

  it('does not list individual families (that lives in the Species tab)', () => {
    renderPanel();
    expect(screen.queryByText(/corundum/i)).toBeNull();
  });

  it('reports a maxed-out reputation without a next tier', () => {
    renderPanel({ reputation: 500 });
    screen.getByText(/max tier/i);
  });
});
