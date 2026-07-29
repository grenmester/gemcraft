import { gemArt } from '../logic/gemArt.js';

const RARITY_COLOR = {
  Common: 'text-slate-400',
  Uncommon: 'text-green-400',
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-yellow-400'
};

export default function SpeciesCard({ species, discovered, isNew, onOpen }) {
  const art = gemArt(species.id);

  if (!discovered) {
    return (
      <div className="flex h-full w-full flex-col items-center gap-1 rounded-lg border border-dashed border-slate-700 bg-slate-800/40 p-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700/40 text-2xl opacity-40 grayscale" aria-hidden="true">
          ❔
        </div>
        <span className="font-semibold text-slate-500">???</span>
        <span className="text-xs text-slate-600">{species.realWorldLocations[0]}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full w-full flex-col items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 p-3 text-center transition hover:border-yellow-400 hover:bg-slate-700"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-600 text-2xl"
        style={{ backgroundColor: `${art.tint}33` }}
        aria-hidden="true"
      >
        {art.glyph}
      </div>
      <span className="font-semibold text-slate-100">{species.name}</span>
      <span className="flex items-center gap-1 text-xs">
        <span className={RARITY_COLOR[species.rarity] ?? 'text-slate-400'}>{species.rarity}</span>
        {species.phenomena?.length > 0 && <span className="text-yellow-400">✨</span>}
      </span>
      {isNew && (
        <span className="rounded bg-green-500 px-1.5 py-0.5 text-xs font-bold text-slate-900">NEW</span>
      )}
    </button>
  );
}
