/**
 * Pure helpers for encoding interactive model state in URL query params.
 * See useUrlState for the React hook that wires these to window.history.
 */

export interface NumberParamSpec {
  kind: "number";
  min: number;
  max: number;
  step?: number;
  fallback: number;
}

export interface EnumParamSpec<T extends string> {
  kind: "enum";
  values: readonly T[];
  fallback: T;
}

export type UrlParamSpec<T> = T extends number
  ? NumberParamSpec
  : T extends string
    ? EnumParamSpec<T & string>
    : never;

export function numberParam(
  spec: Omit<NumberParamSpec, "kind">,
): NumberParamSpec {
  return { kind: "number", ...spec };
}

export function enumParam<T extends string>(
  spec: Omit<EnumParamSpec<T>, "kind">,
): EnumParamSpec<T> {
  return { kind: "enum", ...spec };
}

export function decodeParam<T extends string>(
  spec: EnumParamSpec<T>,
  raw: string | null,
): T;
export function decodeParam(spec: NumberParamSpec, raw: string | null): number;
export function decodeParam(
  spec: NumberParamSpec | EnumParamSpec<string>,
  raw: string | null,
): number | string;
export function decodeParam(
  spec: NumberParamSpec | EnumParamSpec<string>,
  raw: string | null,
): number | string {
  if (raw === null) return spec.fallback;

  if (spec.kind === "enum") {
    return spec.values.includes(raw) ? raw : spec.fallback;
  }

  if (raw.trim() === "") return spec.fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return spec.fallback;

  const clamped = Math.min(spec.max, Math.max(spec.min, parsed));
  if (spec.step) {
    return Math.min(
      spec.max,
      Math.max(spec.min, Math.round(clamped / spec.step) * spec.step),
    );
  }
  return clamped;
}

export function encodeParam<T extends string>(
  spec: EnumParamSpec<T>,
  value: T,
): string | null;
export function encodeParam(spec: NumberParamSpec, value: number): string | null;
export function encodeParam(
  spec: NumberParamSpec | EnumParamSpec<string>,
  value: number | string,
): string | null;
export function encodeParam(
  spec: NumberParamSpec | EnumParamSpec<string>,
  value: number | string,
): string | null {
  if (value === spec.fallback) return null;
  return String(value);
}

export function mergeSearch(
  search: string,
  updates: Record<string, string | null>,
): string {
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }
  const merged = params.toString();
  return merged ? `?${merged}` : "";
}
