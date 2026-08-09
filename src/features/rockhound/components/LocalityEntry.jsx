import EntryModal, { Section, Row } from './EntryModal.jsx';
import {
  findPoolView, rarityCeiling, localitySetProgress, localitiesGatedBy, titleizeWords,
  requirementText
} from '../logic/localityView.js';
import GemGlyph from './GemGlyph.jsx';

export default function LocalityEntry({
  locality, localities, speciesById, gemdex, unlocked, onClose
}) {
  const pool = findPoolView(locality, speciesById, gemdex);
  const ceiling = rarityCeiling(locality, speciesById);
  const progress = localitySetProgress(locality, gemdex);
  const opens = localitiesGatedBy(localities, locality.id);

  return (
    <EntryModal titleId="locality-entry-title" onClose={onClose}>
      <div className="flex items-start gap-4 p-5">
        <span
          className="mt-1 h-12 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: locality.color }}
          aria-hidden="true"
        />
        <div>
          <h3 id="locality-entry-title" className="text-2xl font-bold text-slate-50">{locality.name}</h3>
          <p className="text-sm capitalize text-slate-400">
            {locality.depositType} · {locality.method}
          </p>
          <p className="text-xs text-slate-500">{titleizeWords(locality.region)}</p>
        </div>
      </div>

      <Section title="Access">
        <Row label="Requirement">
          <span>{requirementText(locality.unlockGate, unlocked)}</span>
        </Row>
        <Row label="Deposit"><span className="capitalize">{locality.depositType}</span></Row>
        <Row label="Host rock"><span className="capitalize">{locality.hostRock}</span></Row>
        <Row label="Look for">
          {locality.indicatorMinerals.map(titleizeWords).join(' · ')}
        </Row>
      </Section>

      <Section title="What's here">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wide text-slate-500">up to {ceiling}</span>
          <span className="font-mono text-xs text-slate-400">{progress.found} / {progress.total}</span>
        </div>
        <ul className="flex flex-col gap-1">
          {pool.map((entry) => {
            return (
              <li key={entry.speciesId} className="flex items-center gap-2 text-sm">
                <GemGlyph speciesId={entry.speciesId} variant="pool" hidden={!entry.discovered} />
                <span className={entry.discovered ? 'text-slate-100' : 'text-slate-500'}>
                  {entry.discovered ? entry.name : '???'}
                </span>
                <span className="ml-auto font-mono text-xs text-slate-400">{entry.chance}</span>
              </li>
            );
          })}
        </ul>
        {progress.complete && <p className="mt-2 text-xs text-green-400">✓ Set complete</p>}
      </Section>

      {opens.length > 0 && (
        <Section title="🔓 Counts toward unlocking">
          <p className="text-sm text-slate-200">{opens.map((l) => l.name).join(', ')}</p>
        </Section>
      )}
    </EntryModal>
  );
}
