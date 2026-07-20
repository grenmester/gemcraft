// src/features/rockhound/components/Rockhound.jsx
import { useState, useEffect } from 'react';
import { RockhoundProvider, useRockhound, ADD_ROUGH, RECORD_TEST_SCORE, COMMIT_IDENTIFY, CLEAR_NEW } from '../RockhoundContext.jsx';
import { localities, localitiesById } from '../../../loaders/localities.js';
import { speciesById, species } from '../../../loaders/species.js';
import { completedLocalityIds, completedFamilies, isLocalityUnlocked } from '../logic/progression.js';
import Explore from './Explore.jsx';
import Identify from './Identify.jsx';
import GemdexV5 from './GemdexV5.jsx';
import LocalityMap from './LocalityMap.jsx';
import ProgressionPanel from './ProgressionPanel.jsx';

const TABS = ['Explore', 'Identify', 'Gemdex'];

function familyProgressFor(gemdex) {
  const set = new Set(gemdex);
  const families = [...new Set(species.map((s) => s.family))];
  return families.map((family) => {
    const members = species.filter((s) => s.family === family);
    const discovered = members.filter((s) => set.has(s.id)).length;
    return { family, discovered, total: members.length, complete: discovered === members.length };
  });
}

function RockhoundInner() {
  const { state, dispatch } = useRockhound();
  const [tab, setTab] = useState('Explore');
  const [selectedLocalityId, setSelectedLocalityId] = useState('hidden_creek');

  const activeRough = state.rough[0] ?? null;

  const completedLocalities = completedLocalityIds(localities, state.gemdex);
  const completedFams = completedFamilies(species, state.gemdex);
  const ctx = { reputation: state.reputation, gear: state.gear, completedLocalities, completedFamilies: completedFams };
  const unlockedIds = localities.filter((l) => isLocalityUnlocked(l, ctx)).map((l) => l.id);
  const selectedLocality = localitiesById[selectedLocalityId] ?? localitiesById.hidden_creek;

  useEffect(() => {
    if (tab === 'Gemdex' && state.newlyDiscovered.length > 0) {
      dispatch({ type: CLEAR_NEW });
    }
  }, [tab, state.newlyDiscovered.length, dispatch]);

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex gap-2 border-b border-slate-700 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded px-4 py-2 font-semibold ${tab === t ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === 'Explore' && (
        <div className="flex flex-col gap-4">
          <LocalityMap
            localities={localities}
            unlockedIds={unlockedIds}
            selectedId={selectedLocalityId}
            onSelect={setSelectedLocalityId}
          />
          <Explore
            locality={selectedLocality}
            roughCount={state.rough.length}
            onCollect={(specimen) => dispatch({ type: ADD_ROUGH, payload: specimen })}
          />
        </div>
      )}

      {tab === 'Identify' && (
        activeRough ? (
          <Identify
            key={activeRough.instanceId}
            specimen={activeRough}
            locality={localitiesById[activeRough.origin] ?? localitiesById.hidden_creek}
            speciesById={speciesById}
            testMastery={state.testMastery}
            completedFamilies={completedFams}
            onRunTest={(testId, score) => dispatch({ type: RECORD_TEST_SCORE, payload: { testId, score } })}
            onCommit={(instanceId, guessId) => dispatch({ type: COMMIT_IDENTIFY, payload: { instanceId, guessId } })}
          />
        ) : (
          <p className="text-slate-400">Your bench has no rough — pan a locality in Explore first.</p>
        )
      )}

      {tab === 'Gemdex' && (
        <div className="flex flex-col gap-4">
          <ProgressionPanel reputation={state.reputation} gear={state.gear} familyProgress={familyProgressFor(state.gemdex)} />
          <GemdexV5 species={species} gemdex={state.gemdex} newlyDiscovered={state.newlyDiscovered} />
        </div>
      )}
    </div>
  );
}

export default function Rockhound() {
  return (
    <RockhoundProvider>
      <RockhoundInner />
    </RockhoundProvider>
  );
}
