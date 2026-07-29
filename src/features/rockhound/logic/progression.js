export const REPUTATION_TIERS = [0, 50, 120, 250, 450];
export const FAMILIARITY_BONUS = 0.3;

export function reputationTier(reputation) {
  let tier = 0;
  for (let i = 0; i < REPUTATION_TIERS.length; i++) {
    if (reputation >= REPUTATION_TIERS[i]) tier = i;
  }
  return tier;
}

export function familiarityFactor(family, completedFamiliesList) {
  return completedFamiliesList.includes(family) ? 1 + FAMILIARITY_BONUS : 1;
}

export function localitySetComplete(locality, gemdexSet) {
  return locality.findPool.every((e) => gemdexSet.has(e.species));
}

export function completedLocalityIds(localities, gemdex) {
  const set = new Set(gemdex);
  return localities.filter((l) => localitySetComplete(l, set)).map((l) => l.id);
}

export function familyComplete(family, allSpecies, gemdexSet) {
  const members = allSpecies.filter((s) => s.family === family);
  return members.length > 0 && members.every((s) => gemdexSet.has(s.id));
}

export function completedFamilies(allSpecies, gemdex) {
  const set = new Set(gemdex);
  const families = [...new Set(allSpecies.map((s) => s.family))];
  return families.filter((f) => familyComplete(f, allSpecies, set));
}

function conditionPassed(cond, ctx) {
  switch (cond.type) {
    case 'gear':
      return ctx.gear.includes(cond.id);
    case 'reputation':
      return reputationTier(ctx.reputation) >= cond.tier;
    case 'setComplete':
      return cond.setType === 'locality'
        ? ctx.completedLocalities.includes(cond.id)
        : ctx.completedFamilies.includes(cond.id);
    case 'cash':
      return true; // no economy yet: cash conditions are accelerators, never blocking
    default:
      return false;
  }
}

export function gatePassed(gate, ctx) {
  const evalNode = (node) => ('type' in node ? conditionPassed(node, ctx) : gatePassed(node, ctx));
  if (gate.allOf && !gate.allOf.every(evalNode)) return false;
  if (gate.anyOf && !gate.anyOf.some(evalNode)) return false;
  return true;
}

export function isLocalityUnlocked(locality, ctx) {
  return gatePassed(locality.unlockGate, ctx);
}

export const GEAR_MILESTONES = [
  {
    id: 'sieve',
    label: 'Sieve',
    requirement: 'Reach reputation tier 1',
    when: (ctx) => reputationTier(ctx.reputation) >= 1
  },
  {
    id: 'rock_hammer',
    label: 'Rock Hammer',
    requirement: 'Complete the Hidden Creek set',
    when: (ctx) => ctx.completedLocalities.includes('hidden_creek')
  }
];

export function earnedGear(ctx) {
  return GEAR_MILESTONES.filter((m) => m.when(ctx)).map((m) => m.id);
}

function describeCondition(cond) {
  switch (cond.type) {
    case 'gear':
      return `Needs the ${cond.id.replace(/_/g, ' ')}`;
    case 'reputation':
      return `Reach reputation tier ${cond.tier}`;
    case 'setComplete':
      return `Complete the ${cond.id.replace(/_/g, ' ')} ${cond.setType} set`;
    case 'cash':
      return `Costs ${cond.amount}`;
    default:
      return 'Locked';
  }
}

const describeNode = (node) => ('type' in node ? describeCondition(node) : describeGate(node));

export function describeGate(gate) {
  if (gate.anyOf && gate.anyOf.length) return gate.anyOf.map(describeNode).join(' or ');
  if (gate.allOf && gate.allOf.length) return gate.allOf.map(describeNode).join(' and ');
  return 'Open — available now';
}
