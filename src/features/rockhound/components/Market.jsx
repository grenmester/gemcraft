import { identifiedValue, stoneValue, SHOP_GEAR } from '../logic/market.js';

export default function Market({ cash, identified, stones, speciesById, ownedGear, onSellIdentified, onSellStone, onBuyGear }) {
  const nothingToSell = identified.length === 0 && stones.length === 0;

  return (
    <section className="flex flex-col gap-6">
      <div className="text-lg font-bold text-yellow-400">💰 {cash}</div>

      <div>
        <h3 className="font-bold text-yellow-400 mb-2">Sell</h3>
        {nothingToSell ? (
          <p className="text-slate-500 text-sm">Nothing to sell — identify or cut a stone first.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {identified.map((sp) => (
              <li key={sp.instanceId} className="flex items-center justify-between rounded border border-slate-600 bg-slate-800 p-2">
                <span className="text-slate-100">{speciesById[sp.trueSpeciesId].name} <span className="text-xs text-slate-400">(rough, uncut)</span></span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-slate-300">💰 {identifiedValue(sp, speciesById[sp.trueSpeciesId])}</span>
                  <button type="button" onClick={() => onSellIdentified(sp.instanceId)} className="rounded bg-green-600 hover:bg-green-500 px-3 py-1 text-sm text-white">Sell</button>
                </span>
              </li>
            ))}
            {stones.map((st) => (
              <li key={st.instanceId} className="flex items-center justify-between rounded border border-slate-600 bg-slate-800 p-2">
                <span className="text-slate-100">{speciesById[st.trueSpeciesId].name} <span className="text-xs text-slate-400">({st.cut}{st.phenomena?.length ? ' ✨' : ''})</span></span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-slate-300">💰 {stoneValue(st, speciesById[st.trueSpeciesId])}</span>
                  <button type="button" onClick={() => onSellStone(st.instanceId)} className="rounded bg-green-600 hover:bg-green-500 px-3 py-1 text-sm text-white">Sell</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-bold text-yellow-400 mb-2">Shop — gear</h3>
        <ul className="flex flex-col gap-2">
          {SHOP_GEAR.map((g) => {
            const owned = ownedGear.includes(g.id);
            const affordable = cash >= g.price;
            return (
              <li key={g.id} className="flex items-center justify-between rounded border border-slate-600 bg-slate-800 p-2">
                <span className="text-slate-100 capitalize">{g.name}</span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-slate-300">💰 {g.price}</span>
                  <button
                    type="button"
                    disabled={owned || !affordable}
                    onClick={() => onBuyGear(g.id)}
                    className={`rounded px-3 py-1 text-sm ${owned || !affordable ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold'}`}
                  >
                    {owned ? 'Owned' : 'Buy'}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
