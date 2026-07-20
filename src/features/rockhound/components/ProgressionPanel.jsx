import { reputationTier } from '../logic/progression.js';

export default function ProgressionPanel({ reputation, gear, familyProgress }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-yellow-400 font-bold">⭐ {reputation}</span>
        <span className="text-slate-400 text-sm">Reputation · tier {reputationTier(reputation)}</span>
      </div>

      <div className="text-sm text-slate-300">
        <span className="font-semibold">Gear: </span>
        {gear.length === 0 ? (
          <span className="text-slate-500">none yet</span>
        ) : (
          <span className="capitalize">{gear.map((g) => g.replace(/_/g, ' ')).join(', ')}</span>
        )}
      </div>

      <ul className="flex flex-col gap-1">
        {familyProgress.map((f) => (
          <li key={f.family} className="flex items-center justify-between text-sm">
            <span className="capitalize text-slate-200">{f.family} {f.complete && <span className="text-green-400">✓</span>}</span>
            <span className="font-mono text-slate-400">{f.discovered} / {f.total}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
