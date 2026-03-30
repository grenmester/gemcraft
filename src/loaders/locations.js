import { load } from 'js-yaml';
import { locationsDataSchema } from '../schemas/locations.js';

const yamlModules = import.meta.glob('../data/locations.yaml', { query: '?raw', import: 'default', eager: true });

function loadYaml(rawYaml) {
  const data = load(rawYaml);
  const result = locationsDataSchema.safeParse(data);
  if (!result.success) {
    console.error('❌ Invalid locations.yaml:', result.error.format());
    throw new Error(`locations.yaml validation failed: ${result.error.message}`);
  }
  return result.data;
}

const rawYaml = Object.values(yamlModules)[0];
export const locationsData = loadYaml(rawYaml);
export const LOCATION_TIERS = locationsData;

export const getLocationForTier = (tierKey) => LOCATION_TIERS[tierKey];

export const getUnlockedLocations = (level) => {
  return Object.entries(LOCATION_TIERS)
    .filter(([_, loc]) => loc.unlockLevel <= level)
    .map(([key]) => key);
};
