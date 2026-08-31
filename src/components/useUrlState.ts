"use client";

import { useEffect, useRef, useState } from "react";
import {
  decodeParam,
  encodeParam,
  mergeSearch,
  type EnumParamSpec,
  type NumberParamSpec,
} from "@/lib/url-state";

const WRITE_DEBOUNCE_MS = 200;

/**
 * useState variant whose value is mirrored in a URL query param, so a copied
 * URL reproduces the exact control state.
 *
 * - On mount, initializes from the current URL when the param is present
 *   (invalid values fall back to the spec default), so pages loaded without
 *   params behave exactly as before.
 * - Writes are debounced and use history.replaceState, so dragging a slider
 *   neither spams history nor breaks back/forward.
 *
 * Pass a module-level spec object; an inline literal re-created on each
 * render works too, but a stable spec keeps the mount effect one-shot.
 */
export function useUrlState<T extends string>(
  key: string,
  spec: EnumParamSpec<T>,
): [T, (next: T) => void];
export function useUrlState(
  key: string,
  spec: NumberParamSpec,
): [number, (next: number) => void];
export function useUrlState(
  key: string,
  spec: NumberParamSpec | EnumParamSpec<string>,
): [number | string, (next: never) => void] {
  const [value, setValue] = useState<number | string>(spec.fallback);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get(key);
    if (raw !== null) {
      // One-shot hydration from the URL after mount: the server render can't
      // see query params, so reading them earlier would mismatch hydration
      // (same pattern as the localStorage hydration in ExplainModeContext).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(decodeParam(spec, raw));
    }
    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (next: number | string) => {
    setValue(next);
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      const search = mergeSearch(window.location.search, {
        [key]: encodeParam(spec, next),
      });
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${search}${window.location.hash}`,
      );
    }, WRITE_DEBOUNCE_MS);
  };

  return [value, set as (next: never) => void];
}
