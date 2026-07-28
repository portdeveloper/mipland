"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * Shareable control state via URL query params.
 *
 * `useUrlState` works like `useState`, but mirrors the value into a query
 * param so a specific configuration can be shared by copying the URL:
 *
 * - On load, a present and valid param initializes the value. Missing or
 *   invalid params fall back to the default silently.
 * - On change, the URL updates after a short debounce through
 *   `history.replaceState`, so dragging a slider is one write and never
 *   adds history entries.
 * - Only non-default values appear in the query string. Setting a control
 *   back to its default removes the param again.
 *
 * The server render always uses the default; the param value is adopted
 * right after hydration. This keeps pages fully static, with no Suspense
 * boundary as `useSearchParams` would require.
 *
 * Codecs decide how a value maps to its param string. Keep them at module
 * scope (like the `intParam` / `oneOfParam` results below) so the write
 * effect does not re-run on unrelated renders.
 */

export interface UrlParamCodec<T> {
  /** Convert a raw param into a value, or null when invalid */
  parse: (raw: string) => T | null;
  /** Convert a value into its param string */
  serialize: (value: T) => string;
}

/** Integer param clamped to [min, max]; non-numeric input is rejected */
export function intParam(min: number, max: number): UrlParamCodec<number> {
  return {
    parse: (raw) => {
      if (raw.trim() === "") return null;
      const n = Number(raw);
      if (!Number.isFinite(n)) return null;
      return Math.round(Math.min(max, Math.max(min, n)));
    },
    serialize: (value) => String(value),
  };
}

/** String union param; anything outside `values` is rejected */
export function oneOfParam<T extends string>(
  values: readonly T[]
): UrlParamCodec<T> {
  return {
    parse: (raw) => (values.includes(raw as T) ? (raw as T) : null),
    serialize: (value) => value,
  };
}

const DEBOUNCE_MS = 300;

// The query string is only written by this hook, via replaceState, which
// fires no event. So there is nothing to subscribe to; React re-checks the
// snapshot after hydration, which is what adopts param values on load.
function subscribe() {
  return () => {};
}

function getSearchSnapshot() {
  return window.location.search;
}

function getServerSearchSnapshot() {
  return "";
}

/** Write one param into the current query string, dropping it when null */
function writeParam(key: string, serialized: string | null) {
  const params = new URLSearchParams(window.location.search);
  if (serialized === null) params.delete(key);
  else params.set(key, serialized);
  const query = params.toString();
  const url =
    window.location.pathname +
    (query ? `?${query}` : "") +
    window.location.hash;
  window.history.replaceState(window.history.state, "", url);
}

export function useUrlState<T>(
  key: string,
  defaultValue: T,
  codec: UrlParamCodec<T>
): [T, (next: T) => void] {
  // "" during SSR and hydration, the real query string right after.
  const search = useSyncExternalStore(
    subscribe,
    getSearchSnapshot,
    getServerSearchSnapshot
  );

  // Once the user touches the control, their value wins over the URL.
  const [override, setOverride] = useState<T | null>(null);

  const raw = new URLSearchParams(search).get(key);
  const parsed = raw === null ? null : codec.parse(raw);
  const value = override ?? parsed ?? defaultValue;

  // Mirror user changes into the query string, debounced so a slider drag
  // becomes a single write. Unmount (e.g. client-side navigation) cancels
  // any pending write before it could land on another page's URL.
  useEffect(() => {
    if (override === null) return;
    const timer = window.setTimeout(() => {
      const serialized = codec.serialize(override);
      writeParam(
        key,
        serialized === codec.serialize(defaultValue) ? null : serialized
      );
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [override, key, codec, defaultValue]);

  const setValue = useCallback((next: T) => setOverride(next), []);

  return [value, setValue];
}
