/**
 * Token-Oriented Object Notation (TOON) Converter
 * Optimizes JSON for LLM consumption by using tabular layout for uniform arrays.
 *
 * Rules:
 * 1. Uniform Arrays of Objects -> key[count]{k1,k2}\n v1, v2
 * 2. Objects -> YAML-like indentation
 * 3. Primitives -> Inline
 */

export function jsonToToon(data: any): string {
  if (Array.isArray(data) && isUniformObjectArray(data)) {
    // Root array optimization
    const keys = Object.keys(data[0]);
    const header = `root[${data.length}]{${keys.join(', ')}}`;
    const rows = data.map(item =>
      keys.map(k => serializeValue((item as any)[k])).join(', ')
    ).join('\n');
    return `${header}\n${rows}`;
  }
  return convert(data, 0);
}

function convert(data: any, indentLevel: number): string {
  const indent = '  '.repeat(indentLevel);

  if (data === null) return 'null';
  if (data === undefined) return 'undefined';

  if (typeof data !== 'object') {
    return serializeValue(data);
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    return data.map(item => {
      const val = convert(item, indentLevel + 1).trimStart();
      // If the item is an object, it might be multi-line.
      // YAML array item:
      // - key: val
      //   key2: val
      // To handle this, we need to ensure subsequent lines are indented relative to the dash.
      // But standard YAML parsers (and LLMs) are lenient.
      return `${indent}- ${val}`;
    }).join('\n');
  }

  // Object
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length > 0 && isUniformObjectArray(value)) {
      // Optimized Table Format
      const keys = Object.keys(value[0]);
      const header = `${key}[${value.length}]{${keys.join(', ')}}`;
      lines.push(`${indent}${header}`);

      for (const item of value) {
        const row = keys.map(k => serializeValue((item as any)[k])).join(', ');
        lines.push(`${indent}${row}`);
      }
    } else {
      // Standard Field
      const valStr = convert(value, indentLevel + 1);

      if (typeof value === 'object' && value !== null) {
        // Complex type: New line
        // Special check: empty array/object
        if (valStr === '[]' || valStr === '{}') {
           lines.push(`${indent}${key}: ${valStr}`);
        } else {
           lines.push(`${indent}${key}:\n${valStr}`);
        }
      } else {
        // Primitive: Inline
        lines.push(`${indent}${key}: ${valStr}`);
      }
    }
  }

  if (lines.length === 0) return '{}';
  return lines.join('\n');
}

function isUniformObjectArray(arr: any[]): boolean {
  if (arr.length === 0) return false;
  if (typeof arr[0] !== 'object' || arr[0] === null) return false;

  // Use Set for key comparison to be order-independent
  const keys = new Set(Object.keys(arr[0]));

  for (let i = 1; i < arr.length; i++) {
    if (typeof arr[i] !== 'object' || arr[i] === null) return false;
    const currentKeys = Object.keys(arr[i]);
    if (currentKeys.length !== keys.size) return false;

    for (const k of currentKeys) {
      if (!keys.has(k)) return false;
    }
  }
  return true;
}

function serializeValue(val: any): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';

  if (typeof val === 'string') {
    // Quote if contains delimiters or special chars used in TOON/YAML
    if (val.match(/[:,\{\}\[\]\n]/)) {
      return JSON.stringify(val);
    }
    // Also quote if empty to distinguish from missing
    if (val === '') return '""';
    return val;
  }
  return String(val);
}
