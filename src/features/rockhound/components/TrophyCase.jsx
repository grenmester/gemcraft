import GemGlyph from './GemGlyph.jsx';

const titleize = (s) => s.replace(/_/g, ' ');

export default function TrophyCase({ bestSpecimens, speciesById }) {
  const entries = Object.entries(bestSpecimens)
    .filter(([speciesId]) => speciesById[speciesId])
    .sort((a, b) => b[1].score - a[1].score);

  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-slate-400">
        Your finest cut stone for each species — one trophy per species, best score kept.
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No cut stones yet — cut an identified specimen to earn a trophy.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {entries.map(([speciesId, best]) => {
            return (
              <li
                key={speciesId}
                className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-3"
              >
                <GemGlyph speciesId={speciesId} variant="row" />
                <span className="flex-1">
                  <span className="block font-semibold text-slate-100">{speciesById[speciesId].name}</span>
                  <span className="block text-xs capitalize text-slate-400">
                    {titleize(best.cut)}
                    {best.phenomena?.length > 0 && (
                      <span className="text-yellow-400"> · ✨ {best.phenomena.map(titleize).join(', ')}</span>
                    )}
                  </span>
                </span>
                <span className="font-mono text-sm text-slate-300">{best.score}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
