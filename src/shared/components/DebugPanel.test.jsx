import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RockhoundProvider } from '../../features/rockhound/RockhoundContext.jsx';
import DebugPanel from './DebugPanel.jsx';

function open() {
  render(<RockhoundProvider><DebugPanel /></RockhoundProvider>);
  fireEvent.keyDown(window, { key: 'D', ctrlKey: true, shiftKey: true });
  fireEvent.click(screen.getByRole('button', { name: /debug mode/i }));
}

describe('DebugPanel', () => {
  beforeEach(() => localStorage.clear());

  it('stays hidden until the shortcut is pressed', () => {
    render(<RockhoundProvider><DebugPanel /></RockhoundProvider>);
    expect(screen.queryByRole('button', { name: /debug mode/i })).toBeNull();
  });

  it('offers a level control for every collection method', () => {
    open();
    for (const m of ['panning', 'hardrock', 'geode', 'surface']) {
      screen.getByRole('slider', { name: new RegExp(`${m} level`, 'i') });
    }
  });

  it('reports the depth a level actually reaches, not just the level', () => {
    open();
    const slider = screen.getByRole('slider', { name: /panning level/i });
    fireEvent.change(slider, { target: { value: '6' } });
    // The number that matters when testing the dive is the depth, so the
    // panel must state it rather than making the tester derive it.
    expect(screen.getByTestId('panning-readout').textContent).toMatch(/depth 4/i);
  });

  it('clears both save keys, not just the legacy one', () => {
    localStorage.setItem('rockhound_save_v1', '{"cash":999}');
    localStorage.setItem('gemstone_game_save', '{"legacy":true}');
    open();
    fireEvent.click(screen.getByRole('button', { name: /clear all save data/i }));
    expect(localStorage.getItem('rockhound_save_v1')).toBe(null);
    expect(localStorage.getItem('gemstone_game_save')).toBe(null);
  });
});
