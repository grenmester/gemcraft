// The unidentified pile has a ceiling. Its purpose is to keep the player
// circulating through Identify, Cut and Market rather than hoarding rough.
//
// The cap gates ACQUIRING more (starting a run, collecting the sieve). It
// never blocks banking a haul the player has already risked a run for, so
// the bench can legitimately sit above the cap.

export const BENCH_CAP = 50;

export function benchFull(rough) {
  return rough.length >= BENCH_CAP;
}

export function benchSpace(rough) {
  return Math.max(0, BENCH_CAP - rough.length);
}
