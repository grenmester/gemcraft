import EntryModal, { Section, Row } from './EntryModal.jsx';
import { gemArt, colorHex } from '../logic/gemArt.js';
import { localitiesForSpecies } from '../logic/gemdexView.js';

const RARITY_COLOR = {
  Common: 'text-slate-300',
  Uncommon: 'text-green-400',
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-yellow-400'
};

// Hardness / refractive index may be a point value or a [min, max] range.
const formatRange = (v, digits) =>
  Array.isArray(v)
    ? `${v[0].toFixed(digits)}–${v[1].toFixed(digits)}`
    : v.toFixed(digits);

const maxOf = (v) => (Array.isArray(v) ? v[1] : v);
const titleize = (s) => s.replace(/_/g, ' ');

export default function GemdexEntry({
  species, localities, unlockedIds, cutTechniquesById, best, familyGroup, onClose
}) {
  const art = gemArt(species.id);

  const pools = localitiesForSpecies(localities, species.id);
  const unlocked = new Set(unlockedIds);
  const knownPools = pools.filter((l) => unlocked.has(l.id));
  const lockedCount = pools.length - knownPools.length;

  const cutName = (id) => cutTechniquesById[id]?.name ?? titleize(id);
  const hardnessPct = Math.round((maxOf(species.hardness) / 10) * 100);

  return (
    <EntryModal titleId="gemdex-entry-title" onClose={onClose}>
      {/* Header */}
      <div className="flex items-start gap-4 p-5">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-slate-600 text-4xl"
          style={{ backgroundColor: `${art.tint}33` }}
          aria-hidden="true"
        >
          {art.glyph}
        </div>
        <div className="flex-1">
          <h3 id="gemdex-entry-title" className="text-2xl font-bold text-slate-50">{species.name}</h3>
          <p className="text-sm text-slate-400">
            <span className="capitalize">{titleize(species.family)}</span> family · {species.category} ·{' '}
            <span className={`font-semibold ${RARITY_COLOR[species.rarity] ?? 'text-slate-300'}`}>{species.rarity}</span>
          </p>
          <p className="text-xs text-slate-500">
            {familyGroup.discovered} / {familyGroup.total} in this family
            {familyGroup.complete && <span className="text-green-400"> ✓ set complete</span>}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1">
            {species.colors.map((c) => (
              <li key={c} className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border border-slate-600"
                  style={{ backgroundColor: colorHex(c) || '#8a8f98' }}
                  aria-hidden="true"
                />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Properties */}
      <div className="grid gap-x-8 border-t border-slate-700 px-5 py-3 md:grid-cols-2">
        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-yellow-400">Physical</h4>
          <Row label="Hardness">
            <span className="font-mono">{formatRange(species.hardness, 1)}</span>
            <span className="ml-2 inline-block h-1.5 w-16 overflow-hidden rounded bg-slate-700 align-middle">
              <span className="block h-full bg-yellow-400" style={{ width: `${hardnessPct}%` }} />
            </span>
          </Row>
          <Row label="Sp. gravity"><span className="font-mono">{species.specificGravity.toFixed(2)}</span></Row>
          <Row label="Habit"><span className="capitalize">{species.habit.join(', ')}</span></Row>
          <Row label="Cleavage"><span className="capitalize">{species.cleavage}</span></Row>
          {species.fracture && <Row label="Fracture"><span className="capitalize">{species.fracture}</span></Row>}
        </div>
        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-yellow-400">Optical</h4>
          <Row label="Luster"><span className="capitalize">{species.luster}</span></Row>
          <Row label="Transparency"><span className="capitalize">{species.transparency}</span></Row>
          <Row label="Refr. index">
            <span className="font-mono">
              {species.refractiveIndex == null ? '—' : formatRange(species.refractiveIndex, 3)}
            </span>
          </Row>
          <Row label="Streak">{species.streak}</Row>
          <Row label="UV">
            {species.fluorescence
              ? `LW ${species.fluorescence.longwave} · SW ${species.fluorescence.shortwave}`
              : 'Inert'}
          </Row>
        </div>
      </div>

      {species.phenomena?.length > 0 && (
        <Section title="✨ Phenomena">
          <ul className="text-sm text-slate-200">
            {species.phenomena.map((p) => (
              <li key={p.type}>
                <span className="capitalize">{titleize(p.type)}</span> —{' '}
                <span className="text-slate-400">revealed by <span className="text-slate-200">{cutName(p.revealedBy)}</span></span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Lapidary">
        <Row label="Base value"><span className="font-mono">💰 {species.baseValue}</span></Row>
        <Row label="Cut difficulty">
          <span className="font-mono text-yellow-400">
            {'●'.repeat(species.cutDifficulty)}{'○'.repeat(5 - species.cutDifficulty)}
          </span>
        </Row>
        <Row label="Suitable cuts">{species.suitableCuts.map(cutName).join(', ')}</Row>
      </Section>

      <Section title="Where to find">
        <Row label="Localities">
          {knownPools.length === 0 && lockedCount === 0 && <span className="text-slate-500">Nowhere yet</span>}
          {knownPools.map((l) => l.name).join(' · ')}
          {lockedCount > 0 && (
            <span className="text-slate-500">
              {knownPools.length > 0 ? ' · ' : ''}🔒 ??? ({lockedCount} locked)
            </span>
          )}
        </Row>
        <Row label="In the world">{species.realWorldLocations.join(', ')}</Row>
      </Section>

      <Section title="🏆 Your best">
        {best ? (
          <p className="text-sm text-slate-200">
            <span>{cutName(best.cut)}</span> · score{' '}
            <span className="font-mono">{best.score}</span>
            {best.phenomena?.length > 0 && <span className="text-yellow-400"> · ✨ {best.phenomena.join(', ')}</span>}
          </p>
        ) : (
          <p className="text-sm text-slate-500">No cut stone yet — cut one to claim a trophy.</p>
        )}
      </Section>

      {species.funFact && (
        <Section title="💡 Field note">
          <p className="text-sm italic text-slate-300">{species.funFact}</p>
        </Section>
      )}
    </EntryModal>
  );
}
