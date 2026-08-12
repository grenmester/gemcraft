import { useState } from 'react';
import GemGlyph from './GemGlyph.jsx';
import { rollHaul } from '../../../domain/rollRough.js';
import { breakConsequence, xpForRun, levelForXp } from '../../../domain/dive.js';
import { siteView, descentView, methodProgress } from '../../../viewmodels/diveView.js';
import { FORM_LABELS } from '../../../domain/forms.js';

const WORK_VERB = {
  panning: 'Work',
  surface: 'Comb',
  geode: 'Crack',
  hardrock: 'Break'
};

function Haul({ stones }) {
  return (
    <ul aria-label="Your haul" className="flex flex-col gap-2">
      {stones.map((s) => (
        <li key={s.instanceId} className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-2">
          {/* Species stays hidden: what it is, is Identify's question. */}
          <GemGlyph speciesId={s.trueSpeciesId} variant="row" hidden />
          <span>
            <span className="block text-slate-100">{FORM_LABELS[s.form] ?? 'Rough'}</span>
            <span className="block text-xs text-slate-400">{s.caratWeight} ct · depth {s.foundDepth}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Explore({
  locality, methodXp, setComplete, roughCount, onBank, onLeave = () => {},
  catch: catchInfo = null, sieveHere = false, onPark = () => {}, benchIsFull = false,
  parkBlocked = false, rng = Math.random
}) {
  const [run, setRun] = useState(null);

  const site = siteView(locality, methodXp, setComplete);
  const progress = methodProgress(methodXp);
  const level = levelForXp(methodXp);
  const currentDepth = run ? run.depths[run.depths.length - 1] : 0;
  const descent = run && !run.broke ? descentView(locality, currentDepth, methodXp, setComplete) : null;
  const canDescend = site.showDescent && descent?.available;

  const start = () => {
    setRun({ haul: rollHaul(locality, 1, level, rng), depths: [1], broke: false, lost: [] });
  };

  const descend = () => {
    if (rng() < descent.chance) {
      const { kept, lost } = breakConsequence(run.haul, descent.targetDepth);
      setRun({ ...run, haul: kept, lost, broke: true });
      return;
    }
    setRun({
      ...run,
      haul: [...run.haul, ...rollHaul(locality, descent.targetDepth, level, rng)],
      depths: [...run.depths, descent.targetDepth]
    });
  };

  const bank = () => {
    onBank({ specimens: run.haul, method: locality.method, xp: xpForRun(run.depths, run.broke) });
    setRun(null);
  };

  const verb = WORK_VERB[locality.method] ?? 'Work';

  return (
    <section className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onLeave}
        className="self-start text-sm text-slate-400 transition-colors hover:text-yellow-400"
      >
        {run ? '← Leave run (haul is lost)' : '← Back to the map'}
      </button>

      <header>
        <h2 className="text-2xl font-bold text-yellow-400">{locality.name}</h2>
        <p className="capitalize text-slate-400">{locality.depositType} · {locality.method}</p>
        <p className="text-xs text-slate-500">
          {locality.method} level {progress.level}
          {progress.atCap ? ' · mastered' : ` · ${progress.toNext} xp to next`}
          {' · '}reaches depth {site.reach} of {site.bedrock}
        </p>
      </header>

      {!run && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={benchIsFull}
            onClick={start}
            className={`self-start rounded-lg px-6 py-3 font-bold ${
              benchIsFull
                ? 'cursor-not-allowed bg-slate-700 text-slate-500'
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {verb} the {locality.hostRock}
          </button>
          {benchIsFull && (
            <p className="text-xs text-amber-400">
              Your bench is full — identify or sell some rough before digging more.
            </p>
          )}
        </div>
      )}

      {run && (
        <>
          <p className="text-sm text-slate-300">
            Depth {currentDepth} · carrying {run.haul.length} {run.haul.length === 1 ? 'stone' : 'stones'}
          </p>

          <Haul stones={run.haul} />

          {run.broke && (
            <p role="alert" className="rounded border border-red-700 bg-red-950 p-3 text-sm text-red-200">
              The ground gave way. {run.lost.length > 0
                ? `You lost ${run.lost.length} ${run.lost.length === 1 ? 'stone' : 'stones'} from the deepest stage, and the rest is scuffed.`
                : 'Everything you were carrying is scuffed.'}
            </p>
          )}

          {canDescend && descent.severity === 'real' && (
            <p role="status" className="rounded border border-amber-700 bg-amber-950 p-3 text-sm text-amber-200">
              Below this point a collapse does not just scuff the haul — you lose the stones
              from the deepest stage you worked.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={bank}
              className="rounded-lg bg-green-600 px-5 py-2 font-bold text-white hover:bg-green-500"
            >
              Bank this haul
            </button>
            {canDescend && (
              <button
                type="button"
                onClick={descend}
                className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-500"
              >
                Go deeper — {descent.chanceText} risk
              </button>
            )}
          </div>
        </>
      )}

      <p className="text-slate-300">Unidentified rough on your bench: <strong>{roughCount}</strong></p>

      {catchInfo && (
        sieveHere ? (
          <p className="text-xs text-slate-400">🪣 Your rocker box is working here.</p>
        ) : (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              disabled={!catchInfo.canCatch || parkBlocked}
              onClick={onPark}
              className={`self-start rounded px-4 py-1.5 text-sm ${
                catchInfo.canCatch && !parkBlocked
                  ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                  : 'cursor-not-allowed bg-slate-800 text-slate-600'
              }`}
            >
              🪣 Leave the rocker box here — catches {catchInfo.catchable} of {catchInfo.total}
            </button>
            {!catchInfo.canCatch ? (
              <p className="text-xs text-amber-400">
                There is nothing here you have catalogued yet, so the box would catch nothing.
              </p>
            ) : parkBlocked ? (
              <p className="text-xs text-amber-400">
                Your bench is full — moving the box would collect its haul past the cap, so it
                is staying right where it is. Identify or sell some rough, then try again.
              </p>
            ) : null}
          </div>
        )
      )}
    </section>
  );
}
