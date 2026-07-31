import EntryModal, { Section, Row } from './EntryModal.jsx';

const money = (n) => `💰 ${Math.round(n).toLocaleString()}`;

export default function PriceBreakdown({ title, price, kind, onClose }) {
  return (
    <EntryModal titleId="price-breakdown-title" onClose={onClose}>
      <div className="p-5">
        <h3 id="price-breakdown-title" className="text-2xl font-bold text-slate-50">{title}</h3>
        <p className="text-sm text-slate-400">{money(price.total)}</p>
      </div>

      <Section title="How it adds up">
        <Row label="Base value">{money(price.base)}</Row>
        {kind === 'cut' ? (
          <>
            <Row label="Grade score">{price.score} / 120</Row>
            <Row label="Multiplier">×{price.multiplier.toFixed(2)}</Row>
          </>
        ) : (
          <>
            <Row label="Colour">{price.colorGrade}</Row>
            <Row label="Clarity">{price.clarity}</Row>
            <Row label="Multiplier">×{price.multiplier.toFixed(2)}</Row>
            <Row label="Uncut penalty">×{price.uncutDiscount}</Row>
          </>
        )}
        <Row label="Sells for">{money(price.total)}</Row>
      </Section>

      {kind === 'cut' && (
        <Section title="What made the grade">
          {price.parts.map((p) => (
            <div key={p.key} className="flex items-baseline gap-2 py-0.5">
              <span className="w-16 text-xs uppercase tracking-wide text-slate-500">{p.label}</span>
              <span className="w-10 font-mono text-xs text-slate-300">{Math.round(p.raw)}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded bg-slate-700">
                <span className="block h-full bg-yellow-400" style={{ width: `${Math.min(p.normalised, 100)}%` }} />
              </span>
              <span className="w-16 text-right font-mono text-xs text-slate-400">
                +{p.points.toFixed(1)} pts
              </span>
            </div>
          ))}
          {price.traitBonus > 0 && (
            <p className="mt-1 text-xs text-yellow-400">✨ +{price.traitBonus} for a revealed phenomenon</p>
          )}
        </Section>
      )}

      {kind === 'rough' && (
        <Section title="Why so little">
          <p className="text-sm text-slate-300">
            Uncut stones sell at {price.uncutDiscount * 100}% — a buyer takes on the risk of cutting it.
          </p>
        </Section>
      )}
    </EntryModal>
  );
}
