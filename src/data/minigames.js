export const MINIGAME_TYPES = {
  PAN_CATCH: 'pan_catch',
  CHIP_REVEAL: 'chip_reveal',
  SIEVE_SORT: 'sieve_sort',
  CLIMB_COLLECT: 'climb_collect',
  TUNNEL_TRACE: 'tunnel_trace',
  READ_FLOW: 'read_flow',
  SHAKE_TABLE: 'shake_table',
  MARBLE_EXTRACT: 'marble_extract',
  EXCAVATE_REVEAL: 'excavate_reveal',
  VEIN_TRACE: 'vein_trace',
  ICE_CLIMB: 'ice_climb',
  PIPE_DROP: 'pipe_drop',
  DIAMOND_GRADE: 'diamond_grade',
  DUST_DISCOVER: 'dust_discover',
  MASTER_CHALLENGE: 'master_challenge',
};

export const SCORE_TIERS = [
  { min: 0, max: 25, label: 'Poor', shiftPoints: 1, multiplier: 0.5 },
  { min: 26, max: 50, label: 'Average', shiftPoints: 3, multiplier: 1.0 },
  { min: 51, max: 75, label: 'Good', shiftPoints: 5, multiplier: 1.25 },
  { min: 76, max: 90, label: 'Excellent', shiftPoints: 8, multiplier: 1.5 },
  { min: 91, max: 100, label: 'Mastery', shiftPoints: 15, multiplier: 2.0 },
];

export const getScoreTier = (percentage) => {
  return SCORE_TIERS.find(t => percentage >= t.min && percentage <= t.max) || SCORE_TIERS[0];
};

export const calculateRewards = (baseScore, tier, locationTier) => {
  const gemsFound = Math.floor(baseScore / 10);
  return {
    coins: Math.floor(baseScore * tier.multiplier),
    gems: Math.floor(gemsFound * tier.multiplier),
    shiftPoints: tier.shiftPoints,
    gemTier: tier.multiplier >= 1.5 ? locationTier + 1 : locationTier
  };
};
