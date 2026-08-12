import { localitiesDataSchema } from './schema.js';
import { loadYaml } from '../yaml.js';

const yamlModules = import.meta.glob('./localities.yaml', { query: '?raw', import: 'default', eager: true });

const rawYaml = Object.values(yamlModules)[0];
const localitiesData = loadYaml(rawYaml, localitiesDataSchema, 'localities.yaml');

export const localities = localitiesData.localities;
export const localitiesById = Object.fromEntries(localities.map((l) => [l.id, l]));

// The set of species a locality can yield (used for Identify candidate seeding, §6.1).
export const getFindPoolSpecies = (localityId) =>
  (localitiesById[localityId]?.findPool ?? []).map((entry) => entry.species);
