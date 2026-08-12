/**
 * The suspect list for a specimen. Narrowed by the depth it was dug from:
 * a find pool entry that requires deeper digging cannot explain a shallow
 * stone, and offering it as a candidate would be the game presenting an
 * option it knows to be impossible.
 *
 * `foundDepth` is nullable — saves written before the Dive carry no depth,
 * and those specimens must stay identifiable against the whole pool.
 */
export function seedCandidates(locality, foundDepth = null) {
  const reachable = foundDepth == null
    ? locality.findPool
    : locality.findPool.filter((e) => (e.minDepth ?? 1) <= foundDepth);
  return [...new Set(reachable.map((e) => e.species))];
}
