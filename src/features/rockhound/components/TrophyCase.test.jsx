import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrophyCase from './TrophyCase.jsx';

const SPECIES_BY_ID = {
  ruby: { id: 'ruby', name: 'Ruby' },
  opal: { id: 'opal', name: 'Opal' }
};

describe('TrophyCase', () => {
  it('explains itself and prompts when empty', () => {
    render(<TrophyCase bestSpecimens={{}} speciesById={SPECIES_BY_ID} />);
    screen.getByText(/finest cut stone/i);
    screen.getByText(/no cut stones yet/i);
  });

  it('lists the best stone per species, highest score first', () => {
    render(
      <TrophyCase
        bestSpecimens={{
          ruby: { cut: 'cabochon', score: 500, phenomena: [] },
          opal: { cut: 'cabochon', score: 900, phenomena: ['play_of_color'] }
        }}
        speciesById={SPECIES_BY_ID}
      />
    );
    const names = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(names[0]).toMatch(/Opal/);
    expect(names[1]).toMatch(/Ruby/);
  });

  it('marks a stone whose phenomenon was revealed', () => {
    render(
      <TrophyCase
        bestSpecimens={{ opal: { cut: 'cabochon', score: 900, phenomena: ['play_of_color'] } }}
        speciesById={SPECIES_BY_ID}
      />
    );
    screen.getByText(/✨/);
  });

  it('ignores trophies for species missing from the roster', () => {
    render(
      <TrophyCase
        bestSpecimens={{ ghost_gem: { cut: 'cabochon', score: 999, phenomena: [] } }}
        speciesById={SPECIES_BY_ID}
      />
    );
    screen.getByText(/no cut stones yet/i);
    expect(screen.queryByText(/999/)).toBeNull();
  });
});
