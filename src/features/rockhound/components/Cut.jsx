import { canApply } from '../logic/cut.js';
import { cutSuccessAtLevel } from '../../../loaders/cutTechniques.js';

export default function Cut({
  identified, techniques, cutTechniqueLevel, speciesById, selectedId,
  onSelectSpecimen, lastCutResult, onUnlock, onLevel, onApply
}) {
  if (identified.length === 0) {
    return <p className="text-slate-400">Nothing to cut yet — identify a specimen first.</p>;
  }

  const selected = identified.find((s) => s.instanceId === selectedId) ?? identified[0];
  const selectedSpecies = selected ? speciesById[selected.trueSpeciesId] : null;

  return (
    <section className="flex flex-col md:flex-row gap-6">
      <div className="md:w-1/3 flex flex-col gap-2">
        <h3 className="font-bold text-yellow-400">Identified stones</h3>
        {identified.map((sp) => (
          <button
            key={sp.instanceId}
            type="button"
            onClick={() => onSelectSpecimen(sp.instanceId)}
            className={`text-left rounded border p-2 ${sp.instanceId === selected?.instanceId ? 'border-yellow-400 bg-slate-700' : 'border-slate-600 bg-slate-800'}`}
          >
            <span className="text-slate-100">{speciesById[sp.trueSpeciesId].name}</span>
            <span className="block text-xs text-slate-400">{sp.caratWeight} ct</span>
          </button>
        ))}
      </div>

      <div className="md:w-2/3 flex flex-col gap-3">
        <h3 className="font-bold text-yellow-400">Techniques</h3>
        {lastCutResult && (
          <p className="text-sm text-slate-300">
            Last cut: <strong className="capitalize">{lastCutResult.outcome}</strong>
            {lastCutResult.cutQuality != null && ` · quality ${lastCutResult.cutQuality}`}
            {lastCutResult.phenomena.length > 0 && ` · ✨ ${lastCutResult.phenomena.join(', ')}`}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {techniques.map((t) => {
            const level = cutTechniqueLevel[t.id] ?? 0;
            const unlocked = level >= 1;
            const applicable = unlocked && selectedSpecies && canApply(selectedSpecies, t);
            return (
              <li key={t.id} className="flex items-center gap-2 rounded border border-slate-600 bg-slate-800 p-2">
                <span className="flex-1 text-slate-100">{t.name} {unlocked && <span className="text-xs text-slate-400">Lv {level} · {Math.round(cutSuccessAtLevel(t, level) * 100)}%</span>}</span>
                {!unlocked && (
                  <button type="button" onClick={() => onUnlock(t.id)} className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-1 text-sm text-white">Learn</button>
                )}
                {unlocked && (
                  <button type="button" onClick={() => onLevel(t.id)} className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-1 text-sm text-white">Practice</button>
                )}
                {applicable && (
                  <button type="button" onClick={() => onApply(selected.instanceId, t.id)} className="rounded bg-yellow-500 hover:bg-yellow-400 px-3 py-1 text-sm font-bold text-slate-900">Apply</button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
