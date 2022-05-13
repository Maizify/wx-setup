export type IAnyObject = { [key: string]: any };

export const { isArray } = Array;

export function isPlainObject(value: unknown): value is { [k: string | symbol]: any } {
  return value !== null && Object.prototype.toString.call(value) === '[object Object]';
}

export function isObject(value: unknown): value is object {
  return value !== null && value instanceof Object;
}

export function isSet(value: unknown): value is Set<any> {
  return value instanceof Set;
}

export function isMap(value: unknown): value is Map<any, any> {
  return value instanceof Map;
}

// export function isPrimitive(value: unknown): value is bigint | boolean | number | string | undefined | null {
//   const t = typeof value;
//   return t === 'bigint' || t === 'boolean' || t === 'number' || t === 'string' || t === 'undefined' || value === null;
// }

export function hasChanged(newValue: unknown, oldValue: unknown) {
  return newValue !== oldValue && (newValue === newValue || oldValue === oldValue);
}

export const EMPTY_OBJECT = <const>{};
