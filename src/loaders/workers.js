import { load } from 'js-yaml';
import { workersDataSchema } from '../schemas/workers.js';

const yamlModules = import.meta.glob('../data/workers.yaml', { query: '?raw', import: 'default', eager: true });

function loadYaml(rawYaml) {
  const data = load(rawYaml);
  const result = workersDataSchema.safeParse(data);
  if (!result.success) {
    console.error('❌ Invalid workers.yaml:', result.error.format());
    throw new Error(`workers.yaml validation failed: ${result.error.message}`);
  }
  return result.data;
}

const rawYaml = Object.values(yamlModules)[0];
const workersData = loadYaml(rawYaml);
export const workers = workersData.workers;
export const workersById = Object.fromEntries(workers.map(worker => [worker.id, worker]));
