import { load } from 'js-yaml';
import { speciesDataSchema } from '../schemas/species.js';

const yamlModules = import.meta.glob('../data/species.yaml', { query: '?raw', import: 'default', eager: true });

function loadYaml(rawYaml) {
  const data = load(rawYaml);
  const result = speciesDataSchema.safeParse(data);
  if (!result.success) {
    console.error('❌ Invalid species.yaml:', result.error.format());
    throw new Error(`species.yaml validation failed: ${result.error.message}`);
  }
  return result.data;
}

const rawYaml = Object.values(yamlModules)[0];
const speciesData = loadYaml(rawYaml);

export const species = speciesData.species;
export const speciesById = Object.fromEntries(species.map((s) => [s.id, s]));
