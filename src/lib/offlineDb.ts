import Dexie, { Table } from "dexie";

export interface OfflinePendingUpdate {
  id?: number;
  clientSyncId: string;
  orderId: string;
  poNumber: string;
  unitId: string;
  stage: string;
  quantityCompleted: number;
  photoUrl?: string;
  voiceUrl?: string;
  rawNote: string;
  language: string;
  supervisorName: string;
  createdAt: number;
  synced: boolean;
}

export class ThreadFlowOfflineDb extends Dexie {
  pendingUpdates!: Table<OfflinePendingUpdate, number>;

  constructor() {
    super("ThreadFlowOfflineDB");
    this.version(1).stores({
      pendingUpdates: "++id, clientSyncId, orderId, poNumber, synced, createdAt",
    });
  }
}

export const offlineDb = typeof window !== "undefined" ? new ThreadFlowOfflineDb() : null;

export async function queueOfflineUpdate(
  update: Omit<OfflinePendingUpdate, "id" | "synced" | "createdAt">
): Promise<number | null> {
  if (!offlineDb) return null;
  return await offlineDb.pendingUpdates.add({
    ...update,
    createdAt: Date.now(),
    synced: false,
  });
}

export async function getPendingOfflineUpdates(): Promise<OfflinePendingUpdate[]> {
  if (!offlineDb) return [];
  return await offlineDb.pendingUpdates.where("synced").equals(0).toArray();
}

export async function markOfflineUpdateSynced(clientSyncId: string): Promise<void> {
  if (!offlineDb) return;
  const item = await offlineDb.pendingUpdates
    .where("clientSyncId")
    .equals(clientSyncId)
    .first();
  if (item && item.id) {
    await offlineDb.pendingUpdates.delete(item.id);
  }
}

export async function clearAllSyncedUpdates(): Promise<void> {
  if (!offlineDb) return;
  await offlineDb.pendingUpdates.clear();
}

