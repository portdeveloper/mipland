export function storagePageIndex(slot: number): number {
  return slot >> 7;
}

export function storagePageKey(account: string, slot: number): string {
  return `${account}:${storagePageIndex(slot)}`;
}

export function storageSlotKey(account: string, slot: number): string {
  return `${account}:${slot}`;
}
