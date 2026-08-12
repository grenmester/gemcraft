import { gemArt } from '../../../ui/theme/gemArt.js';

// Variants reproduce the four tile sizes already used across the module, so
// migrating existing call sites is a no-op visually.
const VARIANTS = {
  hero: 'h-20 w-20 rounded-xl border-slate-600 text-4xl',
  card: 'h-12 w-12 rounded-lg border-slate-600 text-2xl',
  row: 'h-10 w-10 rounded-lg border-slate-600 text-xl',
  pool: 'h-7 w-7 rounded border-slate-700 text-base'
};

/**
 * A gem's placeholder art tile. Decoration only — always aria-hidden, so it
 * must sit beside a real text label. `hidden` renders the undiscovered
 * placeholder and deliberately omits the tint, which would leak the colour.
 */
export default function GemGlyph({ speciesId, variant = 'row', hidden = false }) {
  const art = gemArt(speciesId);
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center border ${VARIANTS[variant] ?? VARIANTS.row}`}
      style={hidden ? undefined : { backgroundColor: `${art.tint}33` }}
    >
      {hidden ? '❔' : art.glyph}
    </span>
  );
}
