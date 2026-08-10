import { traitPanel } from '../logic/identifyView.js';

function TraitRow({ row, onReveal }) {
  const reading = row.measured
    ? row.uncertainty != null
      ? `${row.value} ± ${row.uncertainty}`
      : String(row.value)
    : '— not measured';

  return (
    <li className="flex items-center gap-3 border-b border-slate-800 py-2">
      <span className="w-40 shrink-0 text-xs uppercase tracking-wide text-slate-500">{row.label}</span>
      <span aria-label={`${row.label}: ${reading}`} className="flex-1 font-mono text-sm text-slate-200">
        {reading}
      </span>
      {row.free ? (
        <span className="w-24 shrink-0 text-right text-xs text-slate-600">observed</span>
      ) : (
        <button
          type="button"
          aria-label={`Measure ${row.label}`}
          onClick={() => onReveal(row.id, true)}
          className="w-24 shrink-0 rounded bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600"
        >
          {row.measured ? 'Again' : 'Measure'}
        </button>
      )}
    </li>
  );
}

export default function Identify({ specimen, locality, speciesById, onReveal }) {
  const species = speciesById[specimen.trueSpeciesId];
  const panel = traitPanel(specimen, species, speciesById, locality);
  const unmeasured = panel.rows.filter((r) => !r.free && !r.measured);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-2xl font-bold text-yellow-400">Identify the rough</h2>
        <button
          type="button"
          aria-label="Run all tests"
          disabled={unmeasured.length === 0}
          onClick={() => unmeasured.forEach((r) => onReveal(r.id, false))}
          className={`rounded px-4 py-1.5 text-sm ${
            unmeasured.length === 0
              ? 'cursor-not-allowed bg-slate-800 text-slate-600'
              : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
          }`}
        >
          Run all tests
        </button>
      </header>

      <ul className="flex flex-col">
        {panel.rows.map((row) => (
          <TraitRow key={row.id} row={row} onReveal={onReveal} />
        ))}
      </ul>

      <p aria-label="Still consistent with" className="text-sm text-slate-400">
        <span className="text-slate-500">Consistent with: </span>
        {panel.consistent.map((id) => speciesById[id].name).join(', ')}
      </p>

      {unmeasured.length === 0 && !panel.resolved && (
        <p className="rounded border border-amber-700 bg-amber-950 p-3 text-sm text-amber-200">
          Your readings are still too imprecise to separate these. Measure again — each
          careful measurement sharpens your eye, and a narrower reading replaces a wider one.
        </p>
      )}

      <p className="text-xs text-slate-600">
        Measuring by hand reads more precisely than running everything at once — and teaches you more.
      </p>
    </section>
  );
}
