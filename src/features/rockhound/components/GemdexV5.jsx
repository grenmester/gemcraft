import { useState } from 'react';
import { familyGroups, collectionProgress } from '../logic/gemdexView.js';
import SpeciesCard from './SpeciesCard.jsx';
import GemdexEntry from './GemdexEntry.jsx';

export default function GemdexV5({
  species, gemdex, newlyDiscovered, localities, unlockedIds, cutTechniquesById, bestSpecimens
}) {
  const [openId, setOpenId] = useState(null);
  const discovered = new Set(gemdex);
  const isNew = new Set(newlyDiscovered);
  const groups = familyGroups(species, gemdex);
  const { discovered: found, total } = collectionProgress(species, gemdex);

  const openGroup = openId ? groups.find((g) => g.members.some((m) => m.id === openId)) : null;
  const openSpecies = openGroup?.members.find((m) => m.id === openId) ?? null;

  return (
    <section className="flex flex-col gap-5">
      <p className="text-sm text-slate-400">
        Every mineral you have identified — <span className="font-mono text-slate-200">{found} / {total}</span> discovered
      </p>

      {groups.map((g) => (
        <div key={g.family} className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2 border-b border-slate-700 pb-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">{g.family.replace(/_/g, ' ')}</h3>
            {g.complete && <span className="text-green-400" aria-label="set complete">✓</span>}
            <span className="ml-auto font-mono text-xs text-slate-400">{g.discovered} / {g.total}</span>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {g.members.map((s) => (
              <li key={s.id}>
                <SpeciesCard
                  species={s}
                  discovered={discovered.has(s.id)}
                  isNew={isNew.has(s.id)}
                  onOpen={() => setOpenId(s.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}

      {openSpecies && (
        <GemdexEntry
          species={openSpecies}
          localities={localities}
          unlockedIds={unlockedIds}
          cutTechniquesById={cutTechniquesById}
          best={bestSpecimens[openSpecies.id] ?? null}
          familyGroup={openGroup}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  );
}
