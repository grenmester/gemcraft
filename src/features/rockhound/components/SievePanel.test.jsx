import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SievePanel from './SievePanel.jsx';

const base = {
  localityName: 'Hidden Creek', hours: 8, atCap: true,
  pending: 12, benchBlocked: false, canCollect: true
};

describe('SievePanel', () => {
  it('renders nothing when no box is parked', () => {
    const { container } = render(<SievePanel view={null} onCollect={vi.fn()} />);
    expect(container.textContent).toBe('');
  });

  it('says where the box worked and what it holds', () => {
    render(<SievePanel view={base} onCollect={vi.fn()} />);
    const panel = screen.getByRole('status');
    expect(panel.textContent).toMatch(/Hidden Creek/);
    expect(panel.textContent).toMatch(/12/);
  });

  it('hands the haul over when collected', () => {
    const onCollect = vi.fn();
    render(<SievePanel view={base} onCollect={onCollect} />);
    fireEvent.click(screen.getByRole('button', { name: /collect/i }));
    expect(onCollect).toHaveBeenCalledTimes(1);
  });

  it('explains a full bench rather than just disabling the button', () => {
    render(<SievePanel view={{ ...base, benchBlocked: true, canCollect: false }} onCollect={vi.fn()} />);
    expect(screen.getByRole('button', { name: /collect/i }).disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toMatch(/bench is full/i);
  });

  it('says when the box has filled up and stopped working', () => {
    render(<SievePanel view={base} onCollect={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toMatch(/full/i);
  });

  it('offers no collection before anything has accrued', () => {
    render(<SievePanel view={{ ...base, hours: 0, atCap: false, pending: 0, canCollect: false }} onCollect={vi.fn()} />);
    expect(screen.getByRole('button', { name: /collect/i }).disabled).toBe(true);
  });
});
