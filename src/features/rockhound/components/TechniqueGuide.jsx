import EntryModal, { Section, Row } from './EntryModal.jsx';
import { titleize } from '../../../shared/format.js';

export default function TechniqueGuide({ technique, view, onClose }) {
  return (
    <EntryModal titleId="technique-guide-title" onClose={onClose}>
      <div className="p-5">
        <h3 id="technique-guide-title" className="text-2xl font-bold text-slate-50">{technique.name}</h3>
        <p className="text-sm text-slate-400">
          Difficulty {'●'.repeat(technique.difficulty)}{'○'.repeat(5 - technique.difficulty)}
          {view.unlocked ? ` · learned to Lv ${view.level}` : ' · not learned yet'}
        </p>
      </div>

      {view.unsuitableReason && (
        <Section title="Not suitable">
          <p className="text-sm text-slate-400">{view.unsuitableReason}</p>
        </Section>
      )}

      <Section title="Odds on this stone">
        <Row label="Success">
          {!view.suitable ? 'not suitable for this stone' : view.successPct == null ? 'learn it first' : `${view.successPct}%`}
        </Row>
        <Row label="Keeps">{view.keepsPct[0]}–{view.keepsPct[1]}% of the carat</Row>
        <Row label="Cut quality">{view.qualityRange[0]}–{view.qualityRange[1]}</Row>
      </Section>

      <Section title="Suits">
        <Row label="Designed for">
          <span className="capitalize">{technique.suitableFor.transparency.join(', ')}</span>
        </Row>
        {view.reveals.length > 0 && (
          <Row label="✨ Reveals">
            <span className="capitalize">{view.reveals.map(titleize).join(', ')}</span>
          </Row>
        )}
      </Section>

      {view.shatterRisk && view.suitable && (
        <Section title="⚠️ Risk">
          <p className="text-sm text-red-300">
            This stone cleaves. A failed cut here can shatter it and lose it for good.
          </p>
        </Section>
      )}
    </EntryModal>
  );
}
