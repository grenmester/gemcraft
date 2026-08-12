// src/features/rockhound/components/Rockhound.jsx
import { useState, useEffect, useRef } from 'react';
import { useRockhound, COLLECT_HAUL, REVEAL_TRAIT, CLEAR_NEW, UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE, APPLY_CUT, SELL_IDENTIFIED, SELL_STONE, BUY_GEAR, PARK_SIEVE, COLLECT_SIEVE } from '../RockhoundContext.jsx';
import { localities, localitiesById } from '../../../loaders/localities.js';
import { speciesById, species } from '../../../loaders/species.js';
import { cutTechniques, cutTechniquesById } from '../../../loaders/cutTechniques.js';
import { completedLocalityIds, completedFamilies, isLocalityUnlocked } from '../logic/progression.js';
import Explore from './Explore.jsx';
import Identify from './Identify.jsx';
import BenchStrip from './BenchStrip.jsx';
import { benchStrip } from '../logic/identifyView.js';
import { isGraded } from '../logic/grading.js';
import { GRADE_DEFS } from '../logic/tests.js';
import Cut from './Cut.jsx';
import Market from './Market.jsx';
import GemdexV5 from './GemdexV5.jsx';
import LocalityMap from './LocalityMap.jsx';
import TrophyCase from './TrophyCase.jsx';
import CareerPanel from './CareerPanel.jsx';
import StatusFooter from './StatusFooter.jsx';
import SievePanel from './SievePanel.jsx';
import { sieveView, catchView } from '../logic/idleView.js';
import { benchFull } from '../logic/bench.js';
import { defaultId } from '../logic/rollRough.js';

const TABS = ['Explore', 'Identify', 'Cut', 'Market', 'Gemdex'];
const GEMDEX_SUBTABS = ['Species', 'Trophies', 'Career'];

function RockhoundInner() {
  const { state, dispatch } = useRockhound();
  const [tab, setTab] = useState('Explore');
  const [exploringId, setExploringId] = useState(null);
  const [selectedCutId, setSelectedCutId] = useState(null);
  const [gemdexSub, setGemdexSub] = useState('Species');
  const [benchId, setBenchId] = useState(null);
  // Holds the instanceId of the stone whose identity most recently settled —
  // never the species id — so the banner can look the specimen back up at
  // render time and speak honestly about where it actually is (still on the
  // bench, or already fully graded and gone to Cut) rather than freezing a
  // location claim at the moment it resolved.
  const [justResolvedId, setJustResolvedId] = useState(null);
  const awaitingResolution = useRef(null);

  // The bench holds every stone not yet fully known: unidentified rough, and
  // identified stones still missing a grade. A stone drops off once Graded.
  const benchStones = [...state.rough, ...state.identified.filter((s) => !isGraded(s))];
  const activeRough = benchStones.find((s) => s.instanceId === benchId) ?? benchStones[0] ?? null;
  // A resolved stone always ends up in `identified` (rough is exactly the
  // stones not yet resolved), whether or not it is still on the bench.
  const justResolvedSpecimen = justResolvedId
    ? state.identified.find((s) => s.instanceId === justResolvedId) ?? null
    : null;

  const completedLocalities = completedLocalityIds(localities, state.gemdex);
  const completedFams = completedFamilies(species, state.gemdex);
  const ctx = { reputation: state.reputation, gear: state.gear, completedLocalities, completedFamilies: completedFams };
  const unlockedIds = localities.filter((l) => isLocalityUnlocked(l, ctx)).map((l) => l.id);
  const selectedLocality = localitiesById[exploringId] ?? localitiesById.hidden_creek;

  // `now` is read at render rather than stored, so the banner is current on
  // every mount without a ticker. The reducer never reads the clock itself.
  const now = Date.now();
  const sieve = sieveView(state.sieve, localitiesById, state.gemdex, state.exploreMethodXp, state.rough, now);
  const benchIsFull = benchFull(state.rough);
  // Mirrors PARK_SIEVE's own refusal exactly: moving collects the parked
  // box's pending haul first, and that move is refused only when doing so
  // would land past the cap. A first park (no box parked yet, sieve === null)
  // is never refused; nor is parking with a full bench when nothing is
  // pending. `sieve.pending` comes straight from sieveView — never recompute
  // it here.
  const parkBlocked = Boolean(sieve) && sieve.pending > 0 && benchIsFull;

  useEffect(() => {
    // Badges clear only once the Species grid is actually looked at — not when
    // the player lands on Trophies or Career.
    if (tab === 'Gemdex' && gemdexSub === 'Species' && state.newlyDiscovered.length > 0) {
      dispatch({ type: CLEAR_NEW });
    }
  }, [tab, gemdexSub, state.newlyDiscovered.length, dispatch]);

  useEffect(() => {
    // Announce only the stone the player just measured, and only on the
    // measurement that resolved it — otherwise reselecting an
    // already-identified stone would re-announce it as fresh news.
    // `awaitingResolution` is armed only for a diagnostic reveal (see
    // onReveal below), never a grade — grading cannot resolve identity.
    const id = awaitingResolution.current;
    if (!id) return;
    const resolved = state.identified.some((s) => s.instanceId === id);
    if (resolved && !state.rough.some((s) => s.instanceId === id)) {
      awaitingResolution.current = null;
      setJustResolvedId(id);
    }
  }, [state.rough, state.identified]);

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
        exploringId ? (
          <Explore
            locality={selectedLocality}
            methodXp={state.exploreMethodXp[selectedLocality.method] ?? 0}
            setComplete={completedLocalities.includes(selectedLocality.id)}
            roughCount={state.rough.length}
            onBank={(payload) => dispatch({ type: COLLECT_HAUL, payload })}
            onLeave={() => setExploringId(null)}
            catch={state.gear.includes('rocker_box')
              ? catchView(selectedLocality, state.gemdex, state.exploreMethodXp[selectedLocality.method] ?? 0)
              : null}
            sieveHere={state.sieve?.localityId === selectedLocality.id}
            onPark={() => dispatch({ type: PARK_SIEVE, payload: { localityId: selectedLocality.id, now: Date.now(), rng: Math.random, idFactory: defaultId } })}
            benchIsFull={benchIsFull}
            parkBlocked={parkBlocked}
          />
        ) : (
          <>
            <SievePanel
              view={sieve}
              onCollect={() => dispatch({ type: COLLECT_SIEVE, payload: { now: Date.now(), rng: Math.random, idFactory: defaultId } })}
            />
            <LocalityMap
              localities={localities}
              unlockedIds={unlockedIds}
              selectedId={null}
              onSelect={setExploringId}
              speciesById={speciesById}
              gemdex={state.gemdex}
              exploreMethodXp={state.exploreMethodXp}
            />
          </>
        )
      )}

      {tab === 'Identify' && (
        <div className="flex flex-col gap-4">
          {activeRough && (
            <BenchStrip
              entries={benchStrip(benchStones, speciesById)}
              selectedId={activeRough.instanceId}
              onSelect={(id) => { setBenchId(id); setJustResolvedId(null); }}
            />
          )}
          {justResolvedSpecimen && (
            <p role="status" className="rounded border border-green-700 bg-green-950 p-3 text-sm text-green-200">
              That settles it — {speciesById[justResolvedSpecimen.trueSpeciesId].name}.{' '}
              {isGraded(justResolvedSpecimen)
                ? 'It is fully graded already — find it in Cut.'
                : 'It is on your bench, ready to grade.'}
            </p>
          )}
          {activeRough ? (
            <Identify
              key={activeRough.instanceId}
              specimen={activeRough}
              locality={localitiesById[activeRough.origin]}
              speciesById={speciesById}
              identified={Boolean(activeRough.identifiedAs)}
              onReveal={(testId, byHand) => {
                setBenchId(activeRough.instanceId);
                // Grading reads the specimen itself, never the species, so it
                // can never resolve identity — only a diagnostic reveal arms
                // the announcement, and only a diagnostic reveal clears a
                // stale one left by a previously-resolved stone.
                if (!GRADE_DEFS[testId]) {
                  awaitingResolution.current = activeRough.instanceId;
                  setJustResolvedId(null);
                }
                dispatch({ type: REVEAL_TRAIT, payload: { instanceId: activeRough.instanceId, testId, byHand } });
              }}
            />
          ) : (
            <p className="text-slate-400">Nothing on your bench — dig at a locality first.</p>
          )}
        </div>
      )}

      {tab === 'Cut' && (
        <Cut
          identified={state.identified}
          techniques={cutTechniques}
          cutTechniqueLevel={state.cutTechniqueLevel}
          speciesById={speciesById}
          selectedId={selectedCutId ?? state.identified[0]?.instanceId ?? null}
          onSelectSpecimen={setSelectedCutId}
          onUnlock={(techniqueId) => dispatch({ type: UNLOCK_TECHNIQUE, payload: { techniqueId } })}
          onLevel={(techniqueId) => dispatch({ type: LEVEL_TECHNIQUE, payload: { techniqueId } })}
          onApply={(instanceId, techniqueId) => dispatch({ type: APPLY_CUT, payload: { instanceId, techniqueId, rng: Math.random } })}
        />
      )}

      {tab === 'Market' && (
        <Market
          cash={state.cash}
          identified={state.identified}
          stones={state.stones}
          speciesById={speciesById}
          ownedGear={state.gear}
          techniques={cutTechniques}
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

      <StatusFooter
        cash={state.cash}
        roughCount={state.rough.length}
        identifiedCount={state.identified.length}
        stoneCount={state.stones.length}
        gemdexFound={state.gemdex.length}
        gemdexTotal={species.length}
        exploreMethodXp={state.exploreMethodXp}
      />
    </div>
  );
}

export default function Rockhound() {
  return <RockhoundInner />;
}
