// src/features/rockhound/components/ProgressionPanel.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressionPanel from './ProgressionPanel.jsx';

describe('ProgressionPanel', () => {
  const familyProgress = [
    { family: 'quartz', discovered: 4, total: 4, complete: true },
    { family: 'corundum', discovered: 1, total: 1, complete: true },
    { family: 'garnet', discovered: 0, total: 1, complete: false }
  ];

  it('shows reputation and its tier', () => {
    render(<ProgressionPanel reputation={120} gear={['sieve']} familyProgress={familyProgress} />);
    screen.getByText(/120/);
    screen.getByText(/tier 2/i);
  });

  it('lists owned gear', () => {
    render(<ProgressionPanel reputation={50} gear={['sieve', 'rock_hammer']} familyProgress={familyProgress} />);
    screen.getByText(/sieve/i);
    screen.getByText(/rock.hammer/i);
  });

  it('shows "none yet" when no gear is owned', () => {
    render(<ProgressionPanel reputation={0} gear={[]} familyProgress={familyProgress} />);
    screen.getByText(/none yet/i);
  });

  it('renders per-family completion', () => {
    render(<ProgressionPanel reputation={0} gear={[]} familyProgress={familyProgress} />);
    screen.getByText(/quartz/i);
    screen.getByText('4 / 4');
    screen.getByText('0 / 1');
  });
});
