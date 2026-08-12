import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RockhoundProvider } from '../../features/rockhound/RockhoundContext.jsx';
import DebugPanel from './DebugPanel.jsx';
import { effectiveReach } from '../../domain/dive.js';
import { deepestBedrockByMethod } from '../../features/rockhound/logic/localityView.js';

function open() {
  render(<RockhoundProvider><DebugPanel /></RockhoundProvider>);
  fireEvent.keyDown(window, { key: 'D', ctrlKey: true, shiftKey: true });
  fireEvent.click(screen.getByRole('button', { name: /debug mode/i }));
}

describe('DebugPanel', () => {
  beforeEach(() => localStorage.clear());

  it('stays hidden until the shortcut is pressed, then appears', () => {
    // Both halves matter in one test: asserting only the hidden state would
    // pass even if the reveal were deleted outright.
    render(<RockhoundProvider><DebugPanel /></RockhoundProvider>);
    expect(screen.queryByRole('button', { name: /debug mode/i })).toBeNull();
    fireEvent.keyDown(window, { key: 'D', ctrlKey: true, shiftKey: true });
    screen.getByRole('button', { name: /debug mode/i });
  });

  it('hides again when the shortcut is pressed a second time', () => {
    render(<RockhoundProvider><DebugPanel /></RockhoundProvider>);
    fireEvent.keyDown(window, { key: 'D', ctrlKey: true, shiftKey: true });
    fireEvent.keyDown(window, { key: 'D', ctrlKey: true, shiftKey: true });
    expect(screen.queryByRole('button', { name: /debug mode/i })).toBeNull();
  });

  it('offers a level control for every collection method', () => {
    open();
    for (const m of ['panning', 'hardrock', 'geode', 'surface']) {
      screen.getByRole('slider', { name: new RegExp(`${m} level`, 'i') });
    }
  });

  it('reports the depth a level actually reaches at that method\'s deepest site', () => {
    open();
    const slider = screen.getByRole('slider', { name: /panning level/i });
    fireEvent.change(slider, { target: { value: '6' } });
    // Level 6 gives a raw reach of 4, but every panning site bottoms out at 3,
    // so quoting 4 would promise a depth that exists nowhere. The readout must
    // match what the status footer says for the same track.
    const expected = effectiveReach(6, deepestBedrockByMethod.panning, false);
    expect(expected).toBe(3);
    expect(screen.getByTestId('panning-readout').textContent).toMatch(
      new RegExp(`depth ${expected}`, 'i')
    );
  });

  it('quotes a deeper method deeper, so the cap is per-method and not global', () => {
    open();
    fireEvent.change(screen.getByRole('slider', { name: /hardrock level/i }), { target: { value: '10' } });
    // Hardrock reaches the kimberlite pipe at bedrock 5.
    expect(screen.getByTestId('hardrock-readout').textContent).toMatch(/depth 5/i);
  });

  it('clears both save keys, not just the legacy one', () => {
    localStorage.setItem('rockhound_save_v1', '{"cash":999}');
    localStorage.setItem('gemstone_game_save', '{"legacy":true}');
    open();
    fireEvent.click(screen.getByRole('button', { name: /clear all save data/i }));
    expect(localStorage.getItem('rockhound_save_v1')).toBe(null);
    expect(localStorage.getItem('gemstone_game_save')).toBe(null);
  });

  it('offers to rewind the sieve clock for testing', () => {
    open();
    screen.getByRole('button', { name: /simulate 8 hours/i });
  });
});
