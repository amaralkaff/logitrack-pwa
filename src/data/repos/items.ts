import { db } from '../db';
import type { Item } from '../schemas';
import { api, ApiError } from '../api';

export const itemsRepo = {
  list: () => db.items.orderBy('name').toArray(),
  get:  (sku: string) => db.items.get(sku),
  /** Authoritative existence check: Dexie → API fallback → cache mirror. */
  resolve: async (sku: string): Promise<Item | undefined> => {
    const local = await db.items.get(sku);
    if (local) return local;
    try {
      const remote = await api.items.get(sku);
      await db.items.put({ ...remote, updatedAt: remote.updatedAt ?? Date.now() });
      return remote;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return undefined;
      return undefined; // offline — treat as unresolved
    }
  },
  resolveByEan: async (ean: string): Promise<Item | undefined> => {
    const all = await db.items.toArray();
    const local = all.find((i) => i.ean === ean);
    if (local) return local;
    try {
      const remote = await api.items.list();
      const hit = remote.find((i) => i.ean === ean);
      if (hit) await db.items.put({ ...hit, updatedAt: hit.updatedAt ?? Date.now() });
      return hit;
    } catch { return undefined; }
  },
  search: async (q: string): Promise<Item[]> => {
    const qq = q.trim().toLowerCase();
    if (!qq) return [];
    const all = await db.items.toArray();
    return all
      .filter((i) => i.name.toLowerCase().includes(qq) || i.sku.toLowerCase().includes(qq))
      .slice(0, 20);
  },
  adjustStock: async (sku: string, delta: number): Promise<void> => {
    await db.items.where('sku').equals(sku).modify((it) => {
      it.stock = Math.max(0, it.stock + delta);
      it.updatedAt = Date.now();
    });
  },
  lowStock: async (): Promise<Item[]> => {
    const all = await db.items.toArray();
    return all.filter((i) => i.stock <= i.reorderAt);
  },
};
