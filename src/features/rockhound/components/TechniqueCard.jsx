import { expectedCarat } from '../logic/cutView.js';

const titleize = (s) => s.replace(/_/g, ' ');

export default function TechniqueCard({
  technique, view, specimen, onUnlock, onLevel, onApply, onOpenGuide
}) {
  const carat = specimen ? expectedCarat(specimen, technique) : null;
  const dim = !view.unlocked || !view.suitable;

  return (
    <li className={`rounded-lg border p-3 ${dim ? 'border-slate-700 bg-slate-800/40' : 'border-slate-600 bg-slate-800'}`}>
      <div className="flex items-baseline gap-2">
        <span className={`font-semibold ${dim ? 'text-slate-400' : 'text-slate-100'}`}>{technique.name}</span>
        {view.unlocked && <span className="text-xs text-slate-500">Lv {view.level}</span>}
        {view.successPct != null && view.suitable && (
          <span className="ml-auto font-mono text-sm text-yellow-400">{view.successPct}%</span>
        )}
        <button
          type="button"
          aria-label={`About ${technique.name}`}
          onClick={() => onOpenGuide(technique.id)}
          className={`${view.successPct != null && view.suitable ? '' : 'ml-auto '}rounded px-1 text-slate-400 hover:text-white`}
        >
          ⓘ
        </button>
      </div>

      {view.suitable ? (
        <p className="mt-0.5 text-xs text-slate-400">
          keeps {view.keepsPct[0]}–{view.keepsPct[1]}%
          {carat && <> · {carat[0]}–{carat[1]} ct</>} · quality {view.qualityRange[0]}–{view.qualityRange[1]}
        </p>
      ) : (
        <p className="mt-0.5 text-xs text-slate-500">{view.unsuitableReason ?? 'no stone selected'}</p>
      )}

      {view.reveals.length > 0 && view.suitable && (
        <p className="mt-1 text-xs capitalize text-yellow-400">
          ✨ reveals {view.reveals.map(titleize).join(', ')}
        </p>
      )}

      {view.shatterRisk && view.suitable && (
        <p className="mt-1 text-xs text-red-300">⚠️ can shatter this stone — it cleaves</p>
      )}

      <div className="mt-2 flex gap-2">
        {!view.unlocked ? (
          <button
            type="button"
            aria-label={`Learn ${technique.name}`}
            onClick={() => onUnlock(technique.id)}
            className="rounded bg-slate-600 px-3 py-1 text-sm text-white hover:bg-slate-500"
          >
            Learn
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Practice ${technique.name}`}
            onClick={() => onLevel(technique.id)}
            className="rounded bg-slate-600 px-3 py-1 text-sm text-white hover:bg-slate-500"
          >
            Practice
          </button>
        )}
        {view.unlocked && view.suitable && specimen && (
          <button
            type="button"
            aria-label={`Cut it with ${technique.name}`}
            onClick={() => onApply(specimen.instanceId, technique.id)}
            className="rounded bg-yellow-500 px-3 py-1 text-sm font-bold text-slate-900 hover:bg-yellow-400"
          >
            Cut it
          </button>
        )}
      </div>
    </li>
  );
}
