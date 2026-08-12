export default function BenchStrip({ entries, selectedId, onSelect }) {
  if (entries.length === 0) return null;

  return (
    <ul aria-label="Stones on your bench" className="flex flex-wrap gap-2">
      {entries.map((e) => {
        const selected = e.instanceId === selectedId;
        return (
          <li key={e.instanceId}>
            <button
              type="button"
              aria-pressed={selected}
              aria-label={`${e.name ?? `Unidentified ${e.hue} stone`}, ${e.rungLabel}, ${e.measured} of ${e.total} measured`}
              onClick={() => onSelect(e.instanceId)}
              className={`rounded-lg border px-3 py-2 text-left text-xs ${
                selected ? 'border-yellow-400 bg-slate-700' : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <span className="block text-slate-100">{e.name ?? e.hue}</span>
              <span className="block text-slate-500">
                {e.rungLabel} · {e.measured} / {e.total}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
