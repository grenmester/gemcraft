import { load } from 'js-yaml';
import { upgradesDataSchema } from '../schemas/upgrades.js';

const yamlModules = import.meta.glob('../data/upgrades.yaml', { query: '?raw', import: 'default', eager: true });

function loadYaml(rawYaml) {
  const data = load(rawYaml);
  const result = upgradesDataSchema.safeParse(data);
  if (!result.success) {
    console.error('❌ Invalid upgrades.yaml:', result.error.format());
    throw new Error(`upgrades.yaml validation failed: ${result.error.message}`);
  }
  return result.data;
}

const rawYaml = Object.values(yamlModules)[0];
const upgradesData = loadYaml(rawYaml);
export const upgrades = upgradesData.upgrades;
export const upgradesById = Object.fromEntries(upgrades.map(upgrade => [upgrade.id, upgrade]));
