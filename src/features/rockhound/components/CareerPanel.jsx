import { reputationTier, REPUTATION_TIERS, GEAR_MILESTONES } from '../../../domain/progression.js';

export default function CareerPanel({
  reputation, gear, familySetsComplete, familySetsTotal, localitySetsComplete, localitySetsTotal
}) {
  const tier = reputationTier(reputation);
  const nextThreshold = REPUTATION_TIERS[tier + 1] ?? null;
  const floor = REPUTATION_TIERS[tier];
  const pct = nextThreshold
    ? Math.round(((reputation - floor) / (nextThreshold - floor)) * 100)
    : 100;
  const owned = new Set(gear);

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">
        Your standing as a rockhound — reputation, gear and the sets that unlock new ground.
      </p>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-bold text-yellow-400">⭐ {reputation}</span>
          <span className="text-sm text-slate-400">Reputation · tier {tier}</span>
          <span className="ml-auto font-mono text-xs text-slate-400">
            {nextThreshold ? `${reputation} / ${nextThreshold}` : 'max tier'}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded bg-slate-700">
          <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-yellow-400">Gear</h3>
        <ul className="flex flex-col gap-1">
          {GEAR_MILESTONES.map((m) => (
            <li key={m.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span className={owned.has(m.id) ? 'text-slate-100' : 'text-slate-500'}>
                {owned.has(m.id) ? '✓' : '🔒'} {m.label}
              </span>
              <span className="text-xs text-slate-500">{owned.has(m.id) ? 'owned' : m.requirement}</span>
            </li>
          ))}
          {gear
            .filter((g) => !GEAR_MILESTONES.some((m) => m.id === g))
            .map((g) => (
              <li key={g} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="capitalize text-slate-100">✓ {g.replace(/_/g, ' ')}</span>
                <span className="text-xs text-slate-500">bought</span>
              </li>
            ))}
        </ul>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-yellow-400">Sets</h3>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-slate-300">Family sets complete</span>
          <span className="font-mono text-slate-400">{familySetsComplete} / {familySetsTotal}</span>
        </div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-slate-300">Locality sets complete</span>
          <span className="font-mono text-slate-400">{localitySetsComplete} / {localitySetsTotal}</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Completing a family set sharpens your readings on that family; locality sets open new ground.
        </p>
      </div>
    </section>
  );
}
