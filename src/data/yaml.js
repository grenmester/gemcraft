import { load } from 'js-yaml';

/**
 * Parse a raw YAML string and validate it against its Zod schema.
 * Parameterized over schema and filename because the three datasets differ
 * only in those two bindings — the parse-validate-throw shape is identical.
 */
export function loadYaml(rawYaml, schema, filename) {
  const data = load(rawYaml);
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`❌ Invalid ${filename}:`, result.error.format());
    throw new Error(`${filename} validation failed: ${result.error.message}`);
  }
  return result.data;
}
