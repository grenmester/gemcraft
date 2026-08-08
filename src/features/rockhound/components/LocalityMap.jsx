import { useState } from 'react';
import LocalityCard from './LocalityCard.jsx';
import LocalityEntry from './LocalityEntry.jsx';
import { findPoolView, localitySetProgress } from '../logic/localityView.js';
import { levelForXp } from '../logic/dive.js';

export default function LocalityMap({
  localities, unlockedIds, selectedId, onSelect, speciesById, gemdex, exploreMethodXp
}) {
  const [infoId, setInfoId] = useState(null);
  const unlocked = new Set(unlockedIds);
  const infoLocality = localities.find((l) => l.id === infoId) ?? null;

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {localities.map((loc) => (
          <li key={loc.id}>
            <LocalityCard
              locality={loc}
              unlocked={unlocked.has(loc.id)}
              selected={loc.id === selectedId}
              pool={findPoolView(loc, speciesById, gemdex)}
              methodLevel={levelForXp(exploreMethodXp?.[loc.method] ?? 0)}
              progress={localitySetProgress(loc, gemdex)}
              onSelect={onSelect}
              onOpenInfo={setInfoId}
            />
          </li>
        ))}
      </ul>

      {infoLocality && (
        <LocalityEntry
          locality={infoLocality}
          localities={localities}
          speciesById={speciesById}
          gemdex={gemdex}
          unlocked={unlocked.has(infoLocality.id)}
          onClose={() => setInfoId(null)}
        />
      )}
    </>
  );
}
