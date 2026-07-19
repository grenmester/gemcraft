// src/features/rockhound/components/Rockhound.jsx
import { useState, useEffect } from 'react';
import { RockhoundProvider, useRockhound, ADD_ROUGH, RECORD_TEST_SCORE, COMMIT_IDENTIFY, CLEAR_NEW } from '../RockhoundContext.jsx';
import { localitiesById } from '../../../loaders/localities.js';
import { speciesById, species } from '../../../loaders/species.js';
import Explore from './Explore.jsx';
import Identify from './Identify.jsx';
import GemdexV5 from './GemdexV5.jsx';

const TABS = ['Explore', 'Identify', 'Gemdex'];
const STARTER_LOCALITY = localitiesById.hidden_creek;

function RockhoundInner() {
  const { state, dispatch } = useRockhound();
  const [tab, setTab] = useState('Explore');

  const activeRough = state.rough[0] ?? null;

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
        <Explore
          locality={STARTER_LOCALITY}
          roughCount={state.rough.length}
          onCollect={(specimen) => dispatch({ type: ADD_ROUGH, payload: specimen })}
        />
      )}

      {tab === 'Identify' && (
        activeRough ? (
          <Identify
            key={activeRough.instanceId}
            specimen={activeRough}
            locality={localitiesById[activeRough.origin] ?? STARTER_LOCALITY}
            speciesById={speciesById}
            testMastery={state.testMastery}
            onRunTest={(testId, score) => dispatch({ type: RECORD_TEST_SCORE, payload: { testId, score } })}
            onCommit={(instanceId, guessId) => dispatch({ type: COMMIT_IDENTIFY, payload: { instanceId, guessId } })}
          />
        ) : (
          <p className="text-slate-400">Your bench has no rough — pan a locality in Explore first.</p>
        )
      )}

      {tab === 'Gemdex' && (
        <GemdexV5 species={species} gemdex={state.gemdex} newlyDiscovered={state.newlyDiscovered} />
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
