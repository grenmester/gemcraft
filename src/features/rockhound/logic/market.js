export const UNCUT_DISCOUNT = 0.5;

export const gradeFactor = (score) => 0.5 + (score ?? 0) / 100;

export function stoneValue(stone, species) {
  return Math.round(species.baseValue * gradeFactor(stone.score));
}

export function identifiedValue(specimen, species) {
  const grade = 0.5 + ((specimen.colorGrade + specimen.clarity) / 2) / 100;
  return Math.round(species.baseValue * grade * UNCUT_DISCOUNT);
}

export const SHOP_GEAR = [
  { id: 'sieve', name: 'Sieve', price: 120 },
  { id: 'rock_hammer', name: 'Rock Hammer', price: 300 }
];

export function gearPrice(gearId) {
  return SHOP_GEAR.find((g) => g.id === gearId)?.price ?? null;
}
