import { useState, useEffect } from 'react';
import { useRockhound, STORAGE_KEY, DEBUG_SET_METHOD_LEVEL, DEBUG_ADD_CASH, DEBUG_RESET } from '../../features/rockhound/RockhoundContext.jsx';
import { METHOD_ENUM } from '../../schemas/localities.js';
import { levelForXp, MAX_METHOD_LEVEL, effectiveReach } from '../../features/rockhound/logic/dive.js';
import { localities } from '../../loaders/localities.js';

const LEGACY_STORAGE_KEY = 'gemstone_game_save';
/** The deepest bedrock in the data — what a level's reach is quoted against. */
const DEEPEST_BEDROCK = Math.max(...localities.map((l) => l.maxDepth));

const BTN = 'rounded border border-teal-400 bg-slate-700 px-3 py-1.5 text-xs text-white transition-all hover:bg-teal-400 hover:text-slate-900';
const DANGER = 'rounded border border-red-400 bg-slate-700 px-3 py-1.5 text-xs text-red-400 transition-all hover:bg-red-400 hover:text-white';

function MethodControl({ method, xp, onSet }) {
  const level = levelForXp(xp);
  return (
    <div className="flex items-center gap-2">
      <label className="w-20 shrink-0 text-xs capitalize text-slate-300" htmlFor={`dbg-${method}`}>
        {method}
      </label>
      <input
        id={`dbg-${method}`}
        type="range"
        min="0"
        max={MAX_METHOD_LEVEL}
        value={level}
        aria-label={`${method} level`}
        onChange={(e) => onSet(method, Number(e.target.value))}
        className="flex-1"
      />
      <span data-testid={`${method}-readout`} className="w-28 shrink-0 text-right font-mono text-xs text-slate-400">
        Lv {level} · depth {effectiveReach(level, DEEPEST_BEDROCK, false)}
      </span>
    </div>
  );
}

export default function DebugPanel() {
  const { state, dispatch } = useRockhound();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible((v) => !v);
        setIsOpen(false);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!isVisible) return null;

  const setLevel = (method, level) =>
    dispatch({ type: DEBUG_SET_METHOD_LEVEL, payload: { method, level } });

  const clearEverything = () => {
    // Both keys: the legacy save is dead but lingers in existing browsers,
    // and leaving it behind is the bug this panel used to have.
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    window.location.reload();
  };

  return (
    <div className="fixed bottom-20 right-4 z-[9999] min-w-[320px] max-w-md rounded-lg border-2 border-red-400 bg-slate-800 text-sm shadow-lg">
      <button
        type="button"
        aria-label="Debug mode"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-slate-700 p-3 hover:bg-red-400 hover:text-white"
      >
        <span className="font-bold text-red-400">🔧 Debug Mode</span>
        <span className="text-xs opacity-70">{isOpen ? '▼' : '▲'}</span>
      </button>

      {isOpen && (
        <div className="flex flex-col gap-4 p-4">
          <div className="border-b border-slate-700 pb-3">
            <h4 className="mb-2 text-xs uppercase tracking-wide text-slate-400">Explore levels</h4>
            <div className="flex flex-col gap-1.5">
              {METHOD_ENUM.map((m) => (
                <MethodControl key={m} method={m} xp={state.exploreMethodXp[m] ?? 0} onSet={setLevel} />
              ))}
            </div>
          </div>

          <div className="border-b border-slate-700 pb-3">
            <h4 className="mb-2 text-xs uppercase tracking-wide text-slate-400">Cash — 💰 {state.cash}</h4>
            <div className="flex flex-wrap gap-2">
              {[100, 1000, 10000].map((n) => (
                <button key={n} type="button" className={BTN}
                  onClick={() => dispatch({ type: DEBUG_ADD_CASH, payload: { amount: n } })}>
                  +{n.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs uppercase tracking-wide text-red-400">Danger zone</h4>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={DANGER} onClick={() => dispatch({ type: DEBUG_RESET })}>
                Reset Rockhound
              </button>
              <button type="button" className={DANGER} onClick={clearEverything}>
                Clear all save data
              </button>
            </div>
          </div>

          <p className="pt-2 text-center text-xs text-slate-500">Ctrl+Shift+D to toggle</p>
        </div>
      )}
    </div>
  );
}
