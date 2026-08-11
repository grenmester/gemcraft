import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BenchStrip from './BenchStrip.jsx';

const entries = [
  { instanceId: 'a', speciesId: null, name: null, hue: 'colorless', rung: 'unidentified', rungLabel: 'Unidentified', measured: 0, total: 6 },
  { instanceId: 'b', speciesId: 'ruby', name: 'Ruby', hue: 'red', rung: 'identified', rungLabel: 'Identified', measured: 4, total: 6 }
];

describe('BenchStrip', () => {
  it('offers every stone, not just the first', () => {
    // The playtest could only ever reach the head of the pile.
    render(<BenchStrip entries={entries} selectedId="a" onSelect={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('withholds the name of a stone not yet identified', () => {
    render(<BenchStrip entries={entries} selectedId="a" onSelect={vi.fn()} />);
    expect(screen.queryByText('Ruby')).not.toBe(null);
    const unknown = screen.getAllByRole('button')[0];
    expect(unknown.textContent).toMatch(/colorless/i);
    expect(unknown.textContent).not.toMatch(/quartz/i);
  });

  it('shows how far each sheet has got', () => {
    render(<BenchStrip entries={entries} selectedId="a" onSelect={vi.fn()} />);
    expect(screen.getAllByRole('button')[1].textContent).toMatch(/4\s*\/\s*6/);
  });

  it('marks which stone is being worked on', () => {
    render(<BenchStrip entries={entries} selectedId="b" onSelect={vi.fn()} />);
    expect(screen.getAllByRole('button')[1].getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByRole('button')[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('picks up a different stone when one is clicked', () => {
    const onSelect = vi.fn();
    render(<BenchStrip entries={entries} selectedId="a" onSelect={onSelect} />);
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('renders nothing when the bench is empty', () => {
    const { container } = render(<BenchStrip entries={[]} selectedId={null} onSelect={vi.fn()} />);
    expect(container.textContent).toBe('');
  });
});
