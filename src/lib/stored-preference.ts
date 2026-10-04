/**
 * A localStorage value for useSyncExternalStore.
 *
 * The server and the hydrating client render the fallback snapshot, and the
 * stored value is applied right after hydration, so reading a saved
 * preference can no longer produce a hydration mismatch. Writes go through
 * `write` so every subscriber re-reads.
 */
export function storedPreference(key: string) {
  const listeners = new Set<() => void>();

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    read(): string | null {
      return localStorage.getItem(key);
    },
    write(value: string) {
      localStorage.setItem(key, value);
      for (const listener of listeners) listener();
    },
  };
}
