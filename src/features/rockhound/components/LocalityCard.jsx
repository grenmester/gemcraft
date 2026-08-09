import { FaInfoCircle } from 'react-icons/fa';
import { gemArt } from '../logic/gemArt.js';
import { rarityColor } from '../logic/rarity.js';
import { requirementText } from '../logic/localityView.js';

export default function LocalityCard({
  locality, unlocked, selected, pool, methodLevel, progress, onSelect, onOpenInfo
}) {
  return (
    <div className="relative">
      <button
        type="button"
        disabled={!unlocked}
        aria-label={
          `${locality.name}, ${locality.method} level ${methodLevel}, ` +
          `${progress.found} of ${progress.total} found`
        }
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
        <span className="mt-0.5 block text-xs text-slate-400">
          <span className="capitalize">{locality.method}</span>
          <span className="text-slate-500"> · level {methodLevel}</span>
        </span>
        <span className="mt-1 flex items-center gap-1">
          {pool.map((entry) => (
            <span
              key={entry.speciesId}
              data-rarity={entry.rarity ?? 'unknown'}
              className="flex h-6 w-6 items-center justify-center rounded border-2 text-sm"
              style={{ borderColor: rarityColor(entry.rarity) }}
              aria-hidden="true"
            >
              {entry.discovered ? gemArt(entry.speciesId).glyph : '❔'}
            </span>
          ))}
        </span>
      </button>

      {/* Sibling, never nested — nested buttons are invalid HTML. */}
      <button
        type="button"
        aria-label={`${locality.name} field guide`}
        onClick={() => onOpenInfo(locality.id)}
        className="absolute right-2 top-2 rounded p-1 text-slate-500 transition-colors hover:text-yellow-400"
      >
        <FaInfoCircle aria-hidden="true" />
      </button>

      {/* Outside the select button so it never leaks into its accessible name. */}
      <span className={`mt-1 block text-xs ${unlocked ? 'text-slate-500' : 'text-amber-400'}`}>
        {requirementText(locality.unlockGate, unlocked)}
      </span>
    </div>
  );
}
