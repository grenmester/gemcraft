import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LocalityMap from './LocalityMap.jsx';
import { localities } from '../../../loaders/localities.js';

describe('LocalityMap', () => {
  it('renders unlocked localities as enabled and locked ones with a hint', () => {
    render(<LocalityMap localities={localities} unlockedIds={['hidden_creek']} selectedId="hidden_creek" onSelect={() => {}} />);
    // unlocked
    const creek = screen.getByRole('button', { name: /Hidden Creek/i });
    expect(creek.disabled).toBe(false);
    // locked gravel_bar shows its gear hint
    screen.getByText(/Needs the sieve/i);
  });

  it('calls onSelect for an unlocked locality and not for a locked one', () => {
    const onSelect = vi.fn();
    render(<LocalityMap localities={localities} unlockedIds={['hidden_creek']} selectedId="hidden_creek" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Hidden Creek/i }));
    expect(onSelect).toHaveBeenCalledWith('hidden_creek');
    // locked locality button is disabled → clicking does nothing
    const locked = screen.getByRole('button', { name: /Gravel Bar/i });
    expect(locked.disabled).toBe(true);
  });
});
