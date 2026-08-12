import { load } from 'js-yaml';
import { localitiesDataSchema } from '../schemas/localities.js';

const yamlModules = import.meta.glob('../data/localities.yaml', { query: '?raw', import: 'default', eager: true });

function loadYaml(rawYaml) {
  const data = load(rawYaml);
  const result = localitiesDataSchema.safeParse(data);
  if (!result.success) {
    console.error('❌ Invalid localities.yaml:', result.error.format());
    throw new Error(`localities.yaml validation failed: ${result.error.message}`);
  }
  return result.data;
}

const rawYaml = Object.values(yamlModules)[0];
const localitiesData = loadYaml(rawYaml);

export const localities = localitiesData.localities;
export const localitiesById = Object.fromEntries(localities.map((l) => [l.id, l]));

// The set of species a locality can yield (used for Identify candidate seeding, §6.1).
export const getFindPoolSpecies = (localityId) =>
  (localitiesById[localityId]?.findPool ?? []).map((entry) => entry.species);
