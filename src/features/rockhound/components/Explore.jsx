import { rollRough } from '../logic/rollRough.js';

export default function Explore({ locality, roughCount, onCollect, rng = Math.random }) {
  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-bold text-yellow-400">{locality.name}</h2>
        <p className="text-slate-400 capitalize">{locality.depositType} · {locality.method}</p>
      </header>

      <button
        type="button"
        onClick={() => onCollect(rollRough(locality, 1, rng))}
        className="self-start rounded-lg bg-blue-600 hover:bg-blue-500 px-6 py-3 font-bold text-white"
      >
        Pan the {locality.hostRock}
      </button>

      <p className="text-slate-300">Unidentified rough on your bench: <strong>{roughCount}</strong></p>
    </section>
  );
}
