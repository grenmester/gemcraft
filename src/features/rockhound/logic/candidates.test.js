import { describe, it, expect } from 'vitest';
import { seedCandidates } from './candidates.js';
import { localities } from '../../../loaders/localities.js';

const creek = localities.find((l) => l.id === 'hidden_creek');

describe('seedCandidates', () => {
  it('never lists a suspect the stone could not possibly be', () => {
    // Topaz is minDepth 2 at Hidden Creek. A stone dug at depth 1 cannot be
    // topaz, so offering it as a suspect would be the game lying.
    expect(seedCandidates(creek, 1)).not.toContain('topaz');
  });

  it('lists the deep suspects once the stone came from deep enough', () => {
    expect(seedCandidates(creek, 2)).toContain('topaz');
  });

  it('falls back to the whole pool when the depth is unknown', () => {
    // Saves written before the Dive have no foundDepth. Filtering those to
    // nothing would make old rough unidentifiable.
    const everything = [...new Set(creek.findPool.map((e) => e.species))];
    expect(seedCandidates(creek, undefined).sort()).toEqual(everything.sort());
    expect(seedCandidates(creek).sort()).toEqual(everything.sort());
  });
});
