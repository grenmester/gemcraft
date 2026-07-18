import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Explore from './Explore.jsx';
import { localitiesById } from '../../../loaders/localities.js';

describe('Explore', () => {
  const loc = localitiesById.hidden_creek;

  it('shows the locality name and rough count', () => {
    render(<Explore locality={loc} roughCount={3} onCollect={() => {}} />);
    screen.getByText('Hidden Creek');
    screen.getByText(/3/);
  });

  it('panning collects a rough specimen from this locality', () => {
    const onCollect = vi.fn();
    render(<Explore locality={loc} roughCount={0} onCollect={onCollect} rng={() => 0} />);
    fireEvent.click(screen.getByRole('button', { name: /pan/i }));
    expect(onCollect).toHaveBeenCalledTimes(1);
    const specimen = onCollect.mock.calls[0][0];
    expect(specimen.origin).toBe('hidden_creek');
    expect(specimen.stage).toBe('rough');
  });
});
