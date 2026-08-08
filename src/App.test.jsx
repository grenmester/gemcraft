import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.jsx';

describe('App', () => {
  beforeEach(() => localStorage.clear());

  it('opens straight into Rockhound with no menu to cross', () => {
    render(<App />);
    // The five Rockhound tabs are the app's only navigation now.
    for (const tab of ['Explore', 'Identify', 'Cut', 'Market', 'Gemdex']) {
      screen.getByRole('button', { name: tab });
    }
  });

  it('no longer shows the retired shell chrome', () => {
    render(<App />);
    // The "Gemstone Collector" banner and the legacy coin bar are both gone.
    expect(screen.queryByText(/Gemstone Collector/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /^Discover$/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Craft$/ })).toBeNull();
  });
});
