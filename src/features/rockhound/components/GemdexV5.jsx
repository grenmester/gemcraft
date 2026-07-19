export default function GemdexV5({ species, gemdex, newlyDiscovered }) {
  const discovered = new Set(gemdex);
  const isNew = new Set(newlyDiscovered);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-yellow-400">
        Gemdex <span className="text-slate-400 text-base font-normal">{discovered.size} / {species.length} discovered</span>
      </h2>

      <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {species.map((s) => {
          const found = discovered.has(s.id);
          return (
            <li key={s.id} className="rounded-lg border border-slate-600 bg-slate-800 p-3 min-h-24 flex flex-col gap-1">
              {found ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">{s.name}</span>
                    {isNew.has(s.id) && (
                      <span className="rounded bg-green-500 px-1.5 py-0.5 text-xs font-bold text-slate-900">NEW</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 capitalize">{s.family} family</span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-500">???</span>
                  <span className="text-xs text-slate-500">Found near {s.realWorldLocations[0]}</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
