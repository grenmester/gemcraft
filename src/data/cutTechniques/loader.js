import { cutTechniquesDataSchema } from './schema.js';
import { loadYaml } from '../yaml.js';

const yamlModules = import.meta.glob('./cutTechniques.yaml', { query: '?raw', import: 'default', eager: true });

const rawYaml = Object.values(yamlModules)[0];
const cutTechniquesData = loadYaml(rawYaml, cutTechniquesDataSchema, 'cutTechniques.yaml');

export const cutTechniques = cutTechniquesData.techniques;
export const cutTechniquesById = Object.fromEntries(cutTechniques.map((t) => [t.id, t]));

// Base success probability for a technique at a given level (§13.3).
export const cutSuccessAtLevel = (technique, level) => {
  const { base, perLevel, maxLevel } = technique.successCurve;
  const clamped = Math.min(Math.max(level, 1), maxLevel);
  return Math.min(base + perLevel * (clamped - 1), 1);
};
