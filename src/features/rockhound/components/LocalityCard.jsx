import { gemArt } from '../logic/gemArt.js';
import { describeGate } from '../logic/progression.js';

export default function LocalityCard({
  locality, unlocked, selected, pool, ceiling, progress, onSelect, onOpenInfo
}) {
  return (
    <div className="relative">
      <button
        type="button"
        disabled={!unlocked}
        aria-label={locality.name}
        onClick={() => onSelect(locality.id)}
        className={`w-full rounded-lg border p-3 pr-10 text-left ${
          selected ? 'border-yellow-400 bg-slate-700' : 'border-slate-600 bg-slate-800'
        } ${unlocked ? 'hover:border-yellow-400' : 'cursor-not-allowed opacity-60'}`}
      >
        <span className="flex items-baseline gap-2">
          <span
            className="h-3 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: locality.color }}
            aria-hidden="true"
          />
          <span className="font-semibold text-slate-100">{locality.name}</span>
          <span className="ml-auto font-mono text-xs text-slate-400">
            {progress.found} / {progress.total}
          </span>
        </span>
        <span className="mt-0.5 block text-xs capitalize text-slate-400">
          {locality.depositType} · {locality.method}
        </span>
        <span className="mt-1 flex items-center gap-1">
          {pool.map((entry) => (
            <span key={entry.speciesId} className="text-base" aria-hidden="true">
              {entry.discovered ? gemArt(entry.speciesId).glyph : '❔'}
            </span>
          ))}
          <span className="ml-auto text-xs text-slate-500">up to {ceiling}</span>
        </span>
      </button>

      {/* Sibling, never nested — nested buttons are invalid HTML. */}
      <button
        type="button"
        aria-label={`${locality.name} field guide`}
        onClick={() => onOpenInfo(locality.id)}
        className="absolute right-2 top-2 rounded px-1 text-slate-400 hover:text-white"
      >
        ℹ️
      </button>

      {/* Outside the select button so it never leaks into its accessible name. */}
      <span className={`mt-1 block text-xs ${unlocked ? 'text-slate-500' : 'text-amber-400'}`}>
        {unlocked ? '✓ ' : '🔒 '}
        {describeGate(locality.unlockGate)}
      </span>
    </div>
  );
}
