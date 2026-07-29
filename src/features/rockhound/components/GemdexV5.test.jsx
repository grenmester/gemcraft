import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GemdexV5 from './GemdexV5.jsx';
import { species } from '../../../loaders/species.js';
import { localities } from '../../../loaders/localities.js';
import { cutTechniquesById } from '../../../loaders/cutTechniques.js';

function renderGemdex(overrides = {}) {
  render(
    <GemdexV5
      species={species}
      gemdex={['sapphire']}
      newlyDiscovered={[]}
      localities={localities}
      unlockedIds={['hidden_creek']}
      cutTechniquesById={cutTechniquesById}
      bestSpecimens={{}}
      {...overrides}
    />
  );
}

describe('GemdexV5', () => {
  it('shows an X / Y discovered header', () => {
    renderGemdex();
    screen.getByText(new RegExp(`1 / ${species.length}`));
  });

  it('reveals discovered species and hides undiscovered ones', () => {
    renderGemdex();
    screen.getByText('Sapphire');
    expect(screen.queryByText('Clear Quartz')).toBeNull();
    expect(screen.getAllByText('???').length).toBeGreaterThan(0);
  });

  it('marks newly discovered species with a NEW badge', () => {
    renderGemdex({ newlyDiscovered: ['sapphire'] });
    screen.getByText('NEW');
  });

  it('groups species under family headings with per-family progress', () => {
    renderGemdex();
    // corundum holds sapphire + ruby; one of two is discovered
    const heading = screen.getByText(/corundum/i);
    expect(heading).toBeTruthy();
    screen.getByText('1 / 2');
  });

  it('opens the detail entry when a discovered species is clicked', () => {
    renderGemdex();
    fireEvent.click(screen.getByRole('button', { name: /Sapphire/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    // the entry shows a property the card does not
    screen.getByText(/Sp. gravity/i);
  });

  it('closes the detail entry again', () => {
    renderGemdex();
    fireEvent.click(screen.getByRole('button', { name: /Sapphire/i }));
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not make undiscovered species clickable', () => {
    renderGemdex();
    expect(screen.queryByRole('button', { name: /\?\?\?/ })).toBeNull();
  });

  it('collapses single-species families into one section instead of a heading each', () => {
    renderGemdex();
    // 4 multi-member families (quartz, garnet, corundum, beryl) + 1 shared section
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(5);
    expect(headings.some((h) => /one species per family/i.test(h.textContent))).toBe(true);
  });

  it('still renders every species in the roster exactly once', () => {
    renderGemdex({ gemdex: species.map((s) => s.id) });
    species.forEach((s) => screen.getByText(s.name));
  });

  it('passes the opened species its own trophy, not another species', () => {
    renderGemdex({
      gemdex: ['sapphire', 'ruby'],
      bestSpecimens: { ruby: { cut: 'cabochon', score: 777, phenomena: [] } }
    });
    fireEvent.click(screen.getByRole('button', { name: /Sapphire/i }));
    screen.getByText(/no cut stone yet/i);
    expect(screen.queryByText(/777/)).toBeNull();
  });
});
