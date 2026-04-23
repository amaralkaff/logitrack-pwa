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
          imageUrl: i.imageUrl, lat: i.lat, lng: i.lng,
          updatedAt: i.updatedAt ?? Date.now(),
        })));
      }
    }
  } catch {
    // items: offline — Dexie keeps its cache
  }

  try {
    const txs = await api.tx.list();
    if (Array.isArray(txs)) {
      await db.transactions.clear();
      if (txs.length) {
        await db.transactions.bulkPut(txs.map((x) => ({
          localId: x.localId ?? x.txId ?? `srv-${x.createdAt}`,
          txId: x.txId,
          sku: x.sku,
          qty: x.qty,
          dir: x.dir,
          source: x.source,
          operatorId: x.operatorId,
          location: x.location,
          condition: x.condition ?? 'good',
          batch: x.batch,
          createdAt: x.createdAt,
          syncedAt: x.syncedAt ?? Date.now(),
        })));
      }
    }
  } catch {
    // tx: offline — keep local queue (may contain unsynced writes)
  }
}
