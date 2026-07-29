// src/features/rockhound/components/Rockhound.jsx
import { useState, useEffect } from 'react';
import { RockhoundProvider, useRockhound, ADD_ROUGH, RECORD_TEST_SCORE, COMMIT_IDENTIFY, CLEAR_NEW, UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE, APPLY_CUT, SELL_IDENTIFIED, SELL_STONE, BUY_GEAR } from '../RockhoundContext.jsx';
import { localities, localitiesById } from '../../../loaders/localities.js';
import { speciesById, species } from '../../../loaders/species.js';
import { cutTechniques, cutTechniquesById } from '../../../loaders/cutTechniques.js';
import { completedLocalityIds, completedFamilies, isLocalityUnlocked } from '../logic/progression.js';
import Explore from './Explore.jsx';
import Identify from './Identify.jsx';
import Cut from './Cut.jsx';
import Market from './Market.jsx';
import GemdexV5 from './GemdexV5.jsx';
import LocalityMap from './LocalityMap.jsx';
import TrophyCase from './TrophyCase.jsx';
import CareerPanel from './CareerPanel.jsx';

const TABS = ['Explore', 'Identify', 'Cut', 'Market', 'Gemdex'];
const GEMDEX_SUBTABS = ['Species', 'Trophies', 'Career'];

function RockhoundInner() {
  const { state, dispatch } = useRockhound();
  const [tab, setTab] = useState('Explore');
  const [selectedLocalityId, setSelectedLocalityId] = useState('hidden_creek');
  const [selectedCutId, setSelectedCutId] = useState(null);
  const [gemdexSub, setGemdexSub] = useState('Species');

  const activeRough = state.rough[0] ?? null;

  const completedLocalities = completedLocalityIds(localities, state.gemdex);
  const completedFams = completedFamilies(species, state.gemdex);
  const ctx = { reputation: state.reputation, gear: state.gear, completedLocalities, completedFamilies: completedFams };
  const unlockedIds = localities.filter((l) => isLocalityUnlocked(l, ctx)).map((l) => l.id);
  const selectedLocality = localitiesById[selectedLocalityId] ?? localitiesById.hidden_creek;

  useEffect(() => {
    // Badges clear only once the Species grid is actually looked at — not when
    // the player lands on Trophies or Career.
    if (tab === 'Gemdex' && gemdexSub === 'Species' && state.newlyDiscovered.length > 0) {
      dispatch({ type: CLEAR_NEW });
    }
  }, [tab, gemdexSub, state.newlyDiscovered.length, dispatch]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end text-lg font-bold text-yellow-400">💰 {state.cash}</div>
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
            speciesById={speciesById}
            gemdex={state.gemdex}
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

      {tab === 'Cut' && (
        <Cut
          identified={state.identified}
          techniques={cutTechniques}
          cutTechniqueLevel={state.cutTechniqueLevel}
          speciesById={speciesById}
          selectedId={selectedCutId ?? state.identified[0]?.instanceId ?? null}
          onSelectSpecimen={setSelectedCutId}
          lastCutResult={state.lastCutResult}
          onUnlock={(techniqueId) => dispatch({ type: UNLOCK_TECHNIQUE, payload: { techniqueId } })}
          onLevel={(techniqueId) => dispatch({ type: LEVEL_TECHNIQUE, payload: { techniqueId } })}
          onApply={(instanceId, techniqueId) => dispatch({ type: APPLY_CUT, payload: { instanceId, techniqueId } })}
        />
      )}

      {tab === 'Market' && (
        <Market
          cash={state.cash}
          identified={state.identified}
          stones={state.stones}
          speciesById={speciesById}
          ownedGear={state.gear}
          onSellIdentified={(instanceId) => dispatch({ type: SELL_IDENTIFIED, payload: { instanceId } })}
          onSellStone={(instanceId) => dispatch({ type: SELL_STONE, payload: { instanceId } })}
          onBuyGear={(gearId) => dispatch({ type: BUY_GEAR, payload: { gearId } })}
        />
      )}

      {tab === 'Gemdex' && (
        <div className="flex flex-col gap-4">
          <nav className="flex gap-2" aria-label="Gemdex sections">
            {GEMDEX_SUBTABS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setGemdexSub(s)}
                aria-current={gemdexSub === s ? 'page' : undefined}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  gemdexSub === s
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </nav>

          {gemdexSub === 'Species' && (
            <GemdexV5
              species={species}
              gemdex={state.gemdex}
              newlyDiscovered={state.newlyDiscovered}
              localities={localities}
              unlockedIds={unlockedIds}
              cutTechniquesById={cutTechniquesById}
              bestSpecimens={state.bestSpecimens}
            />
          )}

          {gemdexSub === 'Trophies' && (
            <TrophyCase bestSpecimens={state.bestSpecimens} speciesById={speciesById} />
          )}

          {gemdexSub === 'Career' && (
            <CareerPanel
              reputation={state.reputation}
              gear={state.gear}
              familySetsComplete={completedFams.length}
              familySetsTotal={new Set(species.map((s) => s.family)).size}
              localitySetsComplete={completedLocalities.length}
              localitySetsTotal={localities.length}
            />
          )}
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
