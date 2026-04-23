import Dexie, { type EntityTable } from 'dexie';
import type { Item, Transaction, SyncJob, User } from './schemas';

export class LogiTrackDB extends Dexie {
  items!: EntityTable<Item, 'sku'>;
  transactions!: EntityTable<Transaction, 'localId'>;
  syncQueue!: EntityTable<SyncJob, 'id'>;
  users!: EntityTable<User, 'operatorId'>;

  constructor() {
    super('logitrack');
    this.version(1).stores({
      // & → primary key, * → multi-entry, others → indexes
      items:        '&sku, name, loc, zone, updatedAt, stock',
      transactions: '&localId, txId, sku, dir, createdAt, syncedAt, operatorId',
      syncQueue:    '++id, kind, nextTryAt',
      users:        '&operatorId',
    });
  }
}

export const db = new LogiTrackDB();

/** Seed dev data if empty (matches prototype screens). */
export async function seedIfEmpty() {
  const n = await db.items.count();
  if (n > 0) return;
  const now = Date.now();
  await db.items.bulkAdd([
    { sku: 'SKU-77421', name: 'Diesel Filter Canister', loc: 'A-12-03', zone: 'A', stock: 248, reorderAt: 40, unit: 'EA', ean: '4901234567890', updatedAt: now },
    { sku: 'SKU-30195', name: 'Cable Harness 3M Reinforced', loc: 'B-04-11', zone: 'B', stock: 12, reorderAt: 20, unit: 'EA', updatedAt: now },
    { sku: 'SKU-11842', name: 'Hydraulic Seal Kit Mk.II', loc: 'A-07-02', zone: 'A', stock: 96, reorderAt: 30, unit: 'EA', updatedAt: now },
    { sku: 'SKU-55010', name: 'Safety Helmet · Class E', loc: 'C-01-08', zone: 'C', stock: 4, reorderAt: 15, unit: 'EA', updatedAt: now },
    { sku: 'SKU-20088', name: 'Thermal Blanket Roll', loc: 'A-11-01', zone: 'A', stock: 33, reorderAt: 10, unit: 'EA', updatedAt: now },
    { sku: 'SKU-66711', name: 'Brake Pad Set · HD', loc: 'B-02-04', zone: 'B', stock: 180, reorderAt: 40, unit: 'SET', updatedAt: now },
  ]);
  await db.users.put({
    operatorId: 'LT-0482', name: 'Rian Kurniawan', role: 'Logistics Officer', shift: '06:00 – 14:00',
  });
}
