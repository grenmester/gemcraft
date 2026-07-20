import { describeGate } from '../logic/progression.js';

export default function LocalityMap({ localities, unlockedIds, selectedId, onSelect }) {
  const unlocked = new Set(unlockedIds);
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {localities.map((loc) => {
        const isUnlocked = unlocked.has(loc.id);
        const isSelected = loc.id === selectedId;
        return (
          <li key={loc.id}>
            <button
              type="button"
              disabled={!isUnlocked}
              onClick={() => onSelect(loc.id)}
              className={`w-full text-left rounded-lg border p-3 ${
                isSelected ? 'border-yellow-400 bg-slate-700' : 'border-slate-600 bg-slate-800'
              } ${isUnlocked ? 'hover:border-yellow-400' : 'opacity-60 cursor-not-allowed'}`}
            >
              <span className="font-semibold text-slate-100">{loc.name}</span>
              <span className="block text-xs text-slate-400 capitalize">{loc.depositType} · {loc.method}</span>
            </button>
            {!isUnlocked && (
              <span className="block text-xs text-amber-400 mt-1">🔒 {describeGate(loc.unlockGate)}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
