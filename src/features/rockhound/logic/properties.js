export function numericProperty(species, prop) {
  const v = prop === 'hardness' ? species.hardness : species.specificGravity;
  return Array.isArray(v) ? (v[0] + v[1]) / 2 : v;
}

export function fluorescenceKey(species) {
  const f = species.fluorescence;
  if (!f) return 'inert';
  return `${f.longwave}/${f.shortwave}`;
}
