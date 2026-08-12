import { speciesDataSchema } from './schema.js';
import { loadYaml } from '../yaml.js';

const yamlModules = import.meta.glob('./species.yaml', { query: '?raw', import: 'default', eager: true });

const rawYaml = Object.values(yamlModules)[0];
const speciesData = loadYaml(rawYaml, speciesDataSchema, 'species.yaml');

export const species = speciesData.species;
export const speciesById = Object.fromEntries(species.map((s) => [s.id, s]));
