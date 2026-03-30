import { load } from 'js-yaml';
import { itemsDataSchema } from '../schemas/items.js';

const yamlModules = import.meta.glob('../data/items.yaml', { query: '?raw', import: 'default', eager: true });

function loadYaml(rawYaml) {
  const data = load(rawYaml);
  const result = itemsDataSchema.safeParse(data);
  if (!result.success) {
    console.error('❌ Invalid items.yaml:', result.error.format());
    throw new Error(`items.yaml validation failed: ${result.error.message}`);
  }
  return result.data;
}

const rawYaml = Object.values(yamlModules)[0];
const itemsData = loadYaml(rawYaml);
export const items = itemsData.items;
export const itemsById = Object.fromEntries(items.map(item => [item.id, item]));
