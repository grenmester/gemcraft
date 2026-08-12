import { useState } from 'react';
import { familyGroups, collectionProgress } from '../../viewmodels/gemdexView.js';
import SpeciesCard from '../common/SpeciesCard.jsx';
import GemdexEntry from '../common/GemdexEntry.jsx';

export default function Gemdex({
  species, gemdex, newlyDiscovered, localities, unlockedIds, cutTechniquesById, bestSpecimens
}) {
  const [openId, setOpenId] = useState(null);
  const discovered = new Set(gemdex);
  const isNew = new Set(newlyDiscovered);
  const groups = familyGroups(species, gemdex);
  const { discovered: found, total } = collectionProgress(species, gemdex);

  const openGroup = openId ? groups.find((g) => g.members.some((m) => m.id === openId)) : null;
  const openSpecies = openGroup?.members.find((m) => m.id === openId) ?? null;

  // Only families with something to collect earn their own section — most
  // families hold a single species, and giving each one a heading stretched the
  // page to three screens of near-empty rows. Singletons share one section.
  const setFamilies = groups.filter((g) => g.total > 1);
  const singles = groups.filter((g) => g.total === 1);
  const singleMembers = singles.flatMap((g) => g.members);
  const singlesFound = singleMembers.filter((s) => discovered.has(s.id)).length;

  const cardFor = (s) => (
    <li key={s.id}>
      <SpeciesCard
        species={s}
        discovered={discovered.has(s.id)}
        isNew={isNew.has(s.id)}
        onOpen={() => setOpenId(s.id)}
      />
    </li>
  );

  return (
    <section className="flex flex-col gap-5">
      <p className="text-sm text-slate-400">
        Every mineral you have identified — <span className="font-mono text-slate-200">{found} / {total}</span> discovered
      </p>

      {setFamilies.map((g) => (
        <div key={g.family} className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2 border-b border-slate-700 pb-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">{g.family.replace(/_/g, ' ')}</h3>
            {g.complete && <span className="text-green-400" aria-label="set complete">✓</span>}
            <span className="ml-auto font-mono text-xs text-slate-400">{g.discovered} / {g.total}</span>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {g.members.map(cardFor)}
          </ul>
        </div>
      ))}

      {singleMembers.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2 border-b border-slate-700 pb-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              One species per family
            </h3>
            <span className="ml-auto font-mono text-xs text-slate-400">{singlesFound} / {singleMembers.length}</span>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {singleMembers.map(cardFor)}
          </ul>
        </div>
      )}

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
