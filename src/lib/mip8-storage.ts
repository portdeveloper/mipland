export function storagePageIndex(slot: number): number {
  return slot >> 7;
}

export function storagePageKey(account: string, slot: number): string {
  return `${account}:${storagePageIndex(slot)}`;
}

export function storageSlotKey(account: string, slot: number): string {
  return `${account}:${slot}`;
}

export const MIP8_COLD_ACCESS_COST = 8_100;
export const MIP8_WARM_ACCESS_COST = 100;

export interface StorageAccess {
  account: string;
  slot: number;
}

export interface ClassifiedStorageAccess extends StorageAccess {
  coldPreMip8: boolean;
  coldMip8: boolean;
  preMip8Gas: number;
  mip8Gas: number;
}

export function classifyStorageAccesses(
  accesses: StorageAccess[],
): ClassifiedStorageAccess[] {
  const touchedSlots = new Set<string>();
  const touchedPages = new Set<string>();

  return accesses.map((access) => {
    const slotKey = storageSlotKey(access.account, access.slot);
    const pageKey = storagePageKey(access.account, access.slot);
    const coldPreMip8 = !touchedSlots.has(slotKey);
    const coldMip8 = !touchedPages.has(pageKey);

    touchedSlots.add(slotKey);
    touchedPages.add(pageKey);

    return {
      ...access,
      coldPreMip8,
      coldMip8,
      preMip8Gas: coldPreMip8
        ? MIP8_COLD_ACCESS_COST
        : MIP8_WARM_ACCESS_COST,
      mip8Gas: coldMip8
        ? MIP8_COLD_ACCESS_COST
        : MIP8_WARM_ACCESS_COST,
    };
  });
}
