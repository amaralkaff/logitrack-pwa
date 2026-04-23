import { db } from '@/data/db';
import { api } from '@/data/api';
import { useApp } from '@/app/store';

/** Pull authoritative state from API on app boot. Silent on failure (offline / unauth). */
export async function hydrateFromServer(): Promise<void> {
  if (!useApp.getState().token) return;
  try {
    const items = await api.items.list();
    if (Array.isArray(items)) {
      await db.items.clear();
      if (items.length) {
        await db.items.bulkPut(items.map((i) => ({
          sku: i.sku, name: i.name, ean: i.ean, loc: i.loc, zone: i.zone,
          stock: i.stock, reorderAt: i.reorderAt ?? 0, unit: i.unit ?? 'EA',
          updatedAt: i.updatedAt ?? Date.now(),
        })));
      }
    }
  } catch {
    // offline / API down / token expired — Dexie keeps last-seen data
  }
}
