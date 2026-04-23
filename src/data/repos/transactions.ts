import { db } from '../db';
import { nanoid } from '@/lib/nanoid';
import type { Direction, Source, Transaction } from '../schemas';
import { itemsRepo } from './items';
import { syncRepo } from './sync';
import { api } from '../api';

interface NewTx {
  sku: string;
  qty: number;          // always positive
  dir: Direction;
  source: Source;
  operatorId: string;
  location?: string;
  batch?: string;
}

export const txRepo = {
  list: (limit = 100) =>
    db.transactions.orderBy('createdAt').reverse().limit(limit).toArray(),

  forSku: (sku: string, limit = 20) =>
    db.transactions.where('sku').equals(sku).reverse().limit(limit).sortBy('createdAt'),

  pendingCount: () =>
    db.transactions.filter((t) => !t.syncedAt).count(),

  /** Writes tx locally, adjusts stock, enqueues upload. Atomic. */
  create: async (input: NewTx): Promise<Transaction> => {
    const now = Date.now();
    const localId = nanoid();
    const delta = input.dir === 'in' ? input.qty : -input.qty;

    const tx: Transaction = {
      localId, sku: input.sku, qty: input.qty, dir: input.dir, source: input.source,
      operatorId: input.operatorId, location: input.location, batch: input.batch,
      condition: 'good', createdAt: now,
    };

    await db.transaction('rw', db.items, db.transactions, db.syncQueue, async () => {
      await db.transactions.add(tx);
      await itemsRepo.adjustStock(input.sku, delta);
      await syncRepo.enqueue({ kind: 'tx.upload', payload: tx, attempts: 0, nextTryAt: now });
    });

    // Fire-and-forget API push. SW BackgroundSync retains + retries on transient errors.
    void api.tx.create(tx).then(async (saved) => {
      await db.transactions.update(tx.localId, {
        txId: saved.txId ?? undefined,
        syncedAt: saved.syncedAt ?? Date.now(),
      });
    }).catch(async (err) => {
      // Hard failures (bad SKU / validation) — stop retrying, roll back local state.
      const status = (err as { status?: number }).status;
      if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
        await db.transaction('rw', db.items, db.transactions, async () => {
          await itemsRepo.adjustStock(input.sku, -delta);
          await db.transactions.delete(tx.localId);
        });
      }
      // 5xx / offline — SW Background Sync keeps the queued POST for retry.
    });

    return tx;
  },
};
