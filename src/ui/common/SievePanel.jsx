export default function SievePanel({ view, onCollect }) {
  if (!view) return null;

  const stones = `${view.pending} ${view.pending === 1 ? 'stone' : 'stones'}`;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-3"
    >
      <span aria-hidden="true" className="text-xl">🪣</span>
      <span className="flex-1 text-sm">
        <span className="block text-slate-200">
          Your rocker box has been working {view.localityName} — {stones} waiting.
        </span>
        <span className="block text-xs text-slate-500">
          {view.benchBlocked
            ? 'Your bench is full — identify or sell before collecting.'
            : view.atCap
              ? 'The box is full and has stopped working.'
              : `Running for ${view.hours.toFixed(1)} h.`}
        </span>
      </span>
      <button
        type="button"
        disabled={!view.canCollect}
        onClick={onCollect}
        className={`rounded px-4 py-1.5 text-sm font-bold ${
          view.canCollect
            ? 'bg-green-600 text-white hover:bg-green-500'
            : 'cursor-not-allowed bg-slate-700 text-slate-500'
        }`}
      >
        Collect
      </button>
    </div>
  );
}
