import { methodTracks } from '../../../viewmodels/footerView.js';
import { BENCH_CAP } from '../../../domain/bench.js';

const METHOD_ICON = { panning: '🥣', hardrock: '⛏️', geode: '🥚', surface: '🔎' };

function Track({ track }) {
  const label = `${track.method} level ${track.level}, reaches depth ${track.reach}` +
    (track.atCap ? ', mastered' : `, ${track.toNext} xp to level ${track.level + 1}`);
  return (
    <div aria-label={label} className="flex min-w-[104px] flex-col gap-0.5">
      <span className="flex items-baseline gap-1 text-xs">
        <span aria-hidden="true">{METHOD_ICON[track.method]}</span>
        <span className="capitalize text-slate-300">{track.method}</span>
        <span className="ml-auto font-mono text-slate-400">
          L{track.level} · d{track.reach}
        </span>
      </span>
      <span className="h-1 overflow-hidden rounded bg-slate-700">
        <span className="block h-full bg-yellow-400" style={{ width: `${track.pct}%` }} />
      </span>
    </div>
  );
}

export default function StatusFooter({
  cash, roughCount, identifiedCount, stoneCount, gemdexFound, gemdexTotal, exploreMethodXp
}) {
  const tracks = methodTracks(exploreMethodXp);
  return (
    <footer className="sticky bottom-0 z-40 border-t border-slate-700 bg-slate-800/95 px-4 py-2 backdrop-blur md:px-6">
      <div className="container mx-auto flex max-w-[1536px] flex-wrap items-center gap-x-6 gap-y-2">
        <span aria-label={`Cash ${cash}`} className="font-bold text-yellow-400">
          💰 {cash.toLocaleString()}
        </span>

        <span aria-label={`Bench: ${roughCount} of ${BENCH_CAP} rough, ${identifiedCount} identified, ${stoneCount} cut`}
              className="text-xs text-slate-400">
          🪨 {roughCount}/{BENCH_CAP} · 🔍 {identifiedCount} · 💎 {stoneCount}
        </span>

        <span aria-label={`Gemdex ${gemdexFound} of ${gemdexTotal}`} className="text-xs text-slate-400">
          📖 {gemdexFound}/{gemdexTotal}
        </span>

        <div className="ml-auto flex flex-wrap gap-x-4 gap-y-2">
          {tracks.map((t) => <Track key={t.method} track={t} />)}
        </div>
      </div>
    </footer>
  );
}
