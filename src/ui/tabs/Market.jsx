import { useState } from 'react';
import GemGlyph from '../common/GemGlyph.jsx';
import PriceBreakdown from '../common/PriceBreakdown.jsx';
import { SHOP_GEAR } from '../../domain/market.js';
import { stonePrice, roughPrice, bestCutEstimate } from '../../viewmodels/marketView.js';
import { money, titleize } from '../../shared/format.js';

// What each purchase actually gets you — a bare price list says nothing.
const GEAR_OPENS = {
  sieve: 'needed for Gravel Bar',
  rock_hammer: 'needed for Pala Pegmatite and Old Quarry'
};

function SellRow({ glyphId, name, detail, total, sellLabel, whyLabel, onSell, onWhy, children }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-3">
      <GemGlyph speciesId={glyphId} variant="row" />
      <span className="flex-1">
        <span className="block font-semibold text-slate-100">{name}</span>
        <span className="block text-xs text-slate-400">{detail}</span>
        {children}
      </span>
      <span className="font-mono text-slate-200">{money(total)}</span>
      <button type="button" aria-label={whyLabel} onClick={onWhy} className="rounded px-1 text-slate-400 hover:text-white">ⓘ</button>
      <button
        type="button"
        aria-label={sellLabel}
        onClick={onSell}
        className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-500"
      >
        Sell
      </button>
    </li>
  );
}

export default function Market({
  cash, identified, stones, speciesById, ownedGear, techniques,
  onSellIdentified, onSellStone, onBuyGear
}) {
  const [explain, setExplain] = useState(null); // { title, price, kind }
  const nothingToSell = identified.length === 0 && stones.length === 0;

  return (
    <section className="flex flex-col gap-6">
      {nothingToSell && (
        <p className="text-sm text-slate-500">Nothing to sell — identify or cut a stone first.</p>
      )}

      {identified.length > 0 && (
        <div>
          <div className="mb-2 flex items-baseline gap-2 border-b border-slate-700 pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Rough — uncut</h3>
            <span className="ml-auto text-xs text-slate-500">uncut stones sell at half</span>
          </div>
          <ul className="flex flex-col gap-2">
            {identified.map((sp, i) => {
              const species = speciesById[sp.trueSpeciesId];
              const price = roughPrice(sp, species);
              const estimate = bestCutEstimate(sp, species, techniques);
              // The carat is only known to the player once measured. Falling
              // back to the true carat when it isn't would leak exactly the
              // number this branch exists to hide — so an ungraded stone
              // falls back to its position in the list instead, which still
              // keeps two ungraded same-species rows distinct.
              const caratLabel = price.caratWeight != null ? `${price.caratWeight} carat` : `ungraded, item ${i + 1}`;
              return (
                <SellRow
                  key={sp.instanceId}
                  glyphId={sp.trueSpeciesId}
                  name={species.name}
                  detail={`${price.caratWeight != null ? `${price.caratWeight} ct` : 'not measured'} · colour ${price.colorGrade ?? 'not measured'} · clarity ${price.clarity ?? 'not measured'}`}
                  total={price.total}
                  sellLabel={`Sell rough ${species.name}, ${caratLabel}`}
                  whyLabel={`Why this price for rough ${species.name}, ${caratLabel}`}
                  onSell={() => onSellIdentified(sp.instanceId)}
                  onWhy={() => setExplain({ title: `${species.name} (rough)`, price, kind: 'rough' })}
                >
                  {estimate != null && estimate > price.total && (
                    <span className="block text-xs text-yellow-400">
                      cutting this could fetch ~{money(estimate)}
                    </span>
                  )}
                </SellRow>
              );
            })}
          </ul>
        </div>
      )}

      {stones.length > 0 && (
        <div>
          <h3 className="mb-2 border-b border-slate-700 pb-1 text-xs font-bold uppercase tracking-wider text-slate-200">
            Cut stones
          </h3>
          <ul className="flex flex-col gap-2">
            {stones.map((st) => {
              const species = speciesById[st.trueSpeciesId];
              const price = stonePrice(st, species);
              const weight = st.caratRetained ?? st.caratWeight;
              return (
                <SellRow
                  key={st.instanceId}
                  glyphId={st.trueSpeciesId}
                  name={species.name}
                  detail={`${titleize(st.cut)} · ${weight} ct · quality ${st.cutQuality}${st.phenomena?.length ? ' · ✨' : ''}`}
                  total={price.total}
                  sellLabel={`Sell cut ${species.name}, ${weight} carat`}
                  whyLabel={`Why this price for cut ${species.name}, ${weight} carat`}
                  onSell={() => onSellStone(st.instanceId)}
                  onWhy={() => setExplain({ title: `${species.name} (${titleize(st.cut)})`, price, kind: 'cut' })}
                />
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-2 border-b border-slate-700 pb-1 text-xs font-bold uppercase tracking-wider text-slate-200">
          Gear
        </h3>
        <ul className="flex flex-col gap-2">
          {SHOP_GEAR.map((g) => {
            const owned = ownedGear.includes(g.id);
            const affordable = cash >= g.price;
            return (
              <li key={g.id} className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-3">
                <span className="flex-1">
                  <span className="block font-semibold text-slate-100">
                    {owned && <span className="text-green-400">✓ </span>}{g.name}
                  </span>
                  <span className="block text-xs text-slate-400">{GEAR_OPENS[g.id] ?? ''}</span>
                </span>
                <span className="font-mono text-slate-200">{money(g.price)}</span>
                <button
                  type="button"
                  aria-label={owned ? `${g.name} owned` : `Buy ${g.name}`}
                  disabled={owned || !affordable}
                  onClick={() => onBuyGear(g.id)}
                  className={`rounded px-3 py-1 text-sm ${
                    owned || !affordable
                      ? 'cursor-not-allowed bg-slate-700 text-slate-500'
                      : 'bg-yellow-500 font-bold text-slate-900 hover:bg-yellow-400'
                  }`}
                >
                  {owned ? 'Owned' : 'Buy'}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {explain && (
        <PriceBreakdown
          title={explain.title}
          price={explain.price}
          kind={explain.kind}
          onClose={() => setExplain(null)}
        />
      )}
    </section>
  );
}
