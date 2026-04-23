import { db } from '../db';
import type { Item } from '../schemas';

export const itemsRepo = {
  list: () => db.items.orderBy('name').toArray(),
  get:  (sku: string) => db.items.get(sku),
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
