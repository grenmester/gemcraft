import { load } from 'js-yaml';
import { cutTechniquesDataSchema } from '../schemas/cutTechniques.js';

const yamlModules = import.meta.glob('../data/cutTechniques.yaml', { query: '?raw', import: 'default', eager: true });

function loadYaml(rawYaml) {
  const data = load(rawYaml);
  const result = cutTechniquesDataSchema.safeParse(data);
  if (!result.success) {
    console.error('❌ Invalid cutTechniques.yaml:', result.error.format());
    throw new Error(`cutTechniques.yaml validation failed: ${result.error.message}`);
  }
  return result.data;
}

const rawYaml = Object.values(yamlModules)[0];
const cutTechniquesData = loadYaml(rawYaml);

export const cutTechniques = cutTechniquesData.techniques;
export const cutTechniquesById = Object.fromEntries(cutTechniques.map((t) => [t.id, t]));

export const getCutTechnique = (id) => cutTechniquesById[id];

// Base success probability for a technique at a given level (§13.3).
export const cutSuccessAtLevel = (technique, level) => {
  const { base, perLevel, maxLevel } = technique.successCurve;
  const clamped = Math.min(Math.max(level, 1), maxLevel);
  return Math.min(base + perLevel * (clamped - 1), 1);
};
