import { useState } from 'react';
import GemGlyph from '../common/GemGlyph.jsx';
import TechniqueCard from '../common/TechniqueCard.jsx';
import TechniqueGuide from '../common/TechniqueGuide.jsx';
import { techniqueView } from '../../viewmodels/cutView.js';
import { isMeasured, measuredQuality } from '../../domain/grading.js';
import { GRADE_DEFS } from '../../domain/gemTests.js';

function Meter({ label, value, max = 100, unit = '' }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-16 shrink-0 text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className="w-16 shrink-0 whitespace-nowrap font-mono text-sm text-slate-200">{value}{unit}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded bg-slate-700">
        <span className="block h-full bg-yellow-400" style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
      </span>
    </div>
  );
}

export default function Cut({
  identified, techniques, cutTechniqueLevel, speciesById,
  selectedId, onSelectSpecimen, onUnlock, onLevel, onApply
}) {
  const [guideId, setGuideId] = useState(null);

  if (identified.length === 0) {
    return <p className="text-slate-400">Nothing to cut yet — identify a specimen first.</p>;
  }

  const selected = identified.find((s) => s.instanceId === selectedId) ?? identified[0];
  const species = selected ? speciesById[selected.trueSpeciesId] : null;
  const guide = guideId ? techniques.find((t) => t.id === guideId) : null;

  return (
    <section className="flex flex-col gap-6 md:flex-row">
      <div className="flex flex-col gap-2 md:w-1/3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400">Stone tray</h3>
        {identified.map((sp, i) => {
          const s = speciesById[sp.trueSpeciesId];
          const isSel = sp.instanceId === selected?.instanceId;
          const weighed = isMeasured(sp, 'weigh');
          // The carat is only known to the player once weighed. Falling back
          // to the true carat when it isn't would leak exactly the number
          // this branch exists to hide — so an unweighed stone falls back to
          // its position in the tray instead, which still keeps two
          // unweighed same-species rows distinct. Mirrors Market.jsx's rough
          // sell list.
          const caratLabel = weighed ? `${measuredQuality(sp).caratWeight} carat` : `ungraded, item ${i + 1}`;
          return (
            <button
              key={sp.instanceId}
              type="button"
              aria-label={`${s.name}, ${caratLabel}`}
              onClick={() => onSelectSpecimen(sp.instanceId)}
              className={`flex items-center gap-3 rounded-lg border p-2 text-left ${
                isSel ? 'border-yellow-400 bg-slate-700' : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <GemGlyph speciesId={sp.trueSpeciesId} variant="row" />
              <span>
                <span className="block text-slate-100">{s.name}</span>
                <span className="block text-xs text-slate-400">
                  {weighed ? `${measuredQuality(sp).caratWeight} ct` : 'not measured'}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 md:w-2/3">
        {species && (
          <div className="flex items-start gap-4 rounded-lg border border-slate-700 bg-slate-800 p-4">
            <GemGlyph speciesId={species.id} variant="hero" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-50">{species.name}</h3>
              <p className="mb-2 text-xs text-slate-500">
                Hardness {Array.isArray(species.hardness) ? species.hardness.join('–') : species.hardness}
                {' · '}cleavage <span className="capitalize">{species.cleavage}</span>
                {' · '}difficulty {'●'.repeat(species.cutDifficulty)}{'○'.repeat(5 - species.cutDifficulty)}
              </p>
              {Object.values(GRADE_DEFS).map((def) => {
                const measured = isMeasured(selected, def.id);
                const value = measuredQuality(selected)[def.property];
                return measured ? (
                  <Meter
                    key={def.id}
                    label={def.name.replace(/^Grade /, '')}
                    value={value}
                    max={def.property === 'caratWeight' ? 5 : 100}
                    unit={def.property === 'caratWeight' ? ' ct' : ''}
                  />
                ) : (
                  <p key={def.id} className="text-xs text-amber-400">
                    {def.name.replace(/^Grade /, '')} — not measured, so a buyer assumes the worst.
                  </p>
                );
              })}
            </div>
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {techniques.map((t) => (
            <TechniqueCard
              key={t.id}
              technique={t}
              view={techniqueView(species, t, cutTechniqueLevel[t.id] ?? 0, selected)}
              specimen={selected}
              onUnlock={onUnlock}
              onLevel={onLevel}
              onApply={onApply}
              onOpenGuide={setGuideId}
            />
          ))}
        </ul>
      </div>

      {guide && (
        <TechniqueGuide
          technique={guide}
          view={techniqueView(species, guide, cutTechniqueLevel[guide.id] ?? 0, selected)}
          onClose={() => setGuideId(null)}
        />
      )}
    </section>
  );
}
