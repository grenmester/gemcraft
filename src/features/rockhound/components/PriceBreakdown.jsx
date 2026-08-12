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
            {/* Carat has no band — there is no discount to explain, so it
                stays a bare reading. */}
            <Row label="Carat">{price.caratWeight ?? 'not measured'}</Row>
            {/* Colour and clarity are judged under a loupe, so a buyer prices
                the worst end of the player's own band, not its centre. Make
                that step legible rather than just showing a smaller number. */}
            <Row label="Colour">
              {price.colorGrade != null
                ? `${price.colorGrade} ± ${price.colorGradeBand} → priced as ${price.colorGradeAppraised}`
                : 'not measured'}
            </Row>
            <Row label="Clarity">
              {price.clarity != null
                ? `${price.clarity} ± ${price.clarityBand} → priced as ${price.clarityAppraised}`
                : 'not measured'}
            </Row>
            <Row label="Multiplier">×{price.multiplier.toFixed(3)}</Row>
            <Row label="Uncut penalty">×{price.uncutDiscount}</Row>
          </>
        )}
        <Row label="Sells for">{money(price.total)}</Row>
      </Section>

      {kind === 'cut' && (
        <Section title="What made the grade">
          {price.parts.map((p) => (
            <div key={p.key} className="flex items-baseline gap-2 py-0.5">
              <span className="w-16 shrink-0 text-xs uppercase tracking-wide text-slate-500">{p.label}</span>
              {/* Carat is the one part whose raw value is fractional — rounding
                  it to a whole number would understate a 1.4 ct stone as "1". */}
              <span className="w-10 shrink-0 font-mono text-xs text-slate-300">
                {p.key === 'carat' ? p.raw : Math.round(p.raw)}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded bg-slate-700">
                <span className="block h-full bg-yellow-400" style={{ width: `${Math.min(p.normalised, 100)}%` }} />
              </span>
              <span className="w-20 shrink-0 whitespace-nowrap text-right font-mono text-xs text-slate-400">
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
          {(price.caratWeight == null || price.colorGrade == null || price.clarity == null) && (
            <p className="text-sm text-slate-300">
              Ungraded traits are priced at their worst case — grading this stone will raise the offer.
            </p>
          )}
        </Section>
      )}
    </EntryModal>
  );
}
