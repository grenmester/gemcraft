// src/features/rockhound/components/Identify.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Identify from './Identify.jsx';
import { speciesById } from '../../../loaders/species.js';
import { localitiesById } from '../../../loaders/localities.js';
import { createRough } from '../logic/rollRough.js';

const mastery = { scratch: 100, heft: 100, uv: 100 };

function renderSapphire(overrides = {}) {
  // foundDepth is explicitly null here (not the createRough default of 1):
  // these tests exercise test-elimination logic against the whole find
  // pool, independent of the depth-narrowing feature, so the specimen
  // models a depth-unknown stone the way a pre-Dive save would.
  const specimen = createRough(
    { trueSpeciesId: 'sapphire', caratWeight: 1, clarity: 80, colorGrade: 80, origin: 'hidden_creek', foundDepth: null },
    () => 'r1'
  );
  const props = {
    specimen,
    locality: localitiesById.hidden_creek,
    speciesById,
    testMastery: mastery,
    onRunTest: vi.fn(),
    onCommit: vi.fn(),
    rng: () => 1, // perfect live-play → sharp bands
    ...overrides
  };
  render(<Identify {...props} />);
  return props;
}

describe('Identify', () => {
  it('starts with all find-pool candidates as suspects', () => {
    renderSapphire();
    screen.getByText(/SUSPECTS: 4/);
  });

  it('a sharp scratch test narrows the four colorless-pool candidates toward sapphire', () => {
    renderSapphire();
    fireEvent.click(screen.getByRole('button', { name: /Scratch Test/i }));
    // hidden_creek pool = quartz(7), almandine_garnet(7.25), sapphire(9), topaz(8)
    // sharp band (~0.5) around 9 keeps only sapphire
    screen.getByText(/SUSPECTS: 1/);
    screen.getByText('Sapphire');
  });

  it('records the test score when a test is run', () => {
    const props = renderSapphire();
    fireEvent.click(screen.getByRole('button', { name: /Scratch Test/i }));
    expect(props.onRunTest).toHaveBeenCalledWith('scratch', 100);
  });

  it('committing a candidate reports the guess', () => {
    const props = renderSapphire();
    fireEvent.click(screen.getByRole('button', { name: /Scratch Test/i }));
    fireEvent.click(screen.getByRole('button', { name: /This is it/i }));
    expect(props.onCommit).toHaveBeenCalledWith('r1', 'sapphire');
  });

  it('passes familiarity through so a completed family sharpens the read', () => {
    // mastery 30, rng 0.5 → livePlay 0.8. Without familiarity the hardness band spans the
    // whole 4-species pool; the corundum familiarity boost (×1.3) narrows it to 2 suspects
    // (topaz + sapphire) without eliminating sapphire (corundum) itself.
    renderSapphire({ testMastery: { scratch: 30, heft: 30, uv: 30 }, completedFamilies: ['corundum'], rng: () => 0.5 });
    fireEvent.click(screen.getByRole('button', { name: /Scratch Test/i }));
    screen.getByText(/SUSPECTS: 2/);
    screen.getByText('Sapphire');
  });
});
