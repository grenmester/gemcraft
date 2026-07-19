import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GemdexV5 from './GemdexV5.jsx';
import { species } from '../../../loaders/species.js';

describe('GemdexV5', () => {
  it('shows an X / Y discovered header', () => {
    render(<GemdexV5 species={species} gemdex={['sapphire']} newlyDiscovered={[]} />);
    screen.getByText(new RegExp(`1 / ${species.length}`));
  });

  it('reveals discovered species and hides undiscovered ones', () => {
    render(<GemdexV5 species={species} gemdex={['sapphire']} newlyDiscovered={[]} />);
    screen.getByText('Sapphire');
    // quartz not discovered → its name is not shown; a locked marker is
    expect(screen.queryByText('Clear Quartz')).toBeNull();
    expect(screen.getAllByText('???').length).toBeGreaterThan(0);
  });

  it('marks newly discovered species with a NEW badge', () => {
    render(<GemdexV5 species={species} gemdex={['sapphire']} newlyDiscovered={['sapphire']} />);
    screen.getByText('NEW');
  });
});
