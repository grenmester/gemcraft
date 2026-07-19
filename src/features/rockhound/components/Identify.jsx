import { useState } from 'react';
import { TEST_DEFS, runTest, eliminate } from '../logic/tests.js';
import { livePlayFromRng } from '../logic/precision.js';
import { seedCandidates } from '../logic/candidates.js';

export default function Identify({ specimen, locality, speciesById, testMastery, onRunTest, onCommit, rng = Math.random }) {
  const [candidates, setCandidates] = useState(() => seedCandidates(locality));
  const trueSpecies = speciesById[specimen.trueSpeciesId];

  const handleTest = (testId) => {
    const livePlay = livePlayFromRng(rng);
    const reading = runTest(testId, trueSpecies, { mastery: testMastery[testId] ?? 0, livePlay });
    setCandidates((prev) => eliminate(prev, speciesById, reading));
    onRunTest(testId, Math.round(livePlay * 100));
  };

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-yellow-400">Identify the rough</h2>
        <span className="font-mono text-slate-300">SUSPECTS: {candidates.length}</span>
      </header>

      <div className="flex flex-wrap gap-2">
        {Object.values(TEST_DEFS).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTest(t.id)}
            className="rounded bg-slate-700 hover:bg-slate-600 px-4 py-2 text-white"
          >
            {t.name}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {candidates.map((id) => (
          <li key={id} className="rounded-lg border border-slate-600 bg-slate-800 p-3 flex flex-col gap-2">
            <span className="font-semibold text-slate-100">{speciesById[id].name}</span>
            <button
              type="button"
              onClick={() => onCommit(specimen.instanceId, id)}
              className="rounded bg-yellow-500 hover:bg-yellow-400 px-3 py-1 text-sm font-bold text-slate-900"
            >
              This is it
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
