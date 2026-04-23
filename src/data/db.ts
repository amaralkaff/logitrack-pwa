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

/** Seed dev data. Idempotent: inserts any missing SKU without touching existing rows. */
export async function seedIfEmpty() {
  const now = Date.now();
  const seed = [
    { sku: 'SKU-77421', name: 'Diesel Filter Canister',       loc: 'A-12-03', zone: 'A', stock: 248, reorderAt: 40, unit: 'EA',  ean: '4901234567890', updatedAt: now },
    { sku: 'SKU-30195', name: 'Cable Harness 3M Reinforced',  loc: 'B-04-11', zone: 'B', stock: 12,  reorderAt: 20, unit: 'EA',  ean: '4012345678905', updatedAt: now },
    { sku: 'SKU-11842', name: 'Hydraulic Seal Kit Mk.II',     loc: 'A-07-02', zone: 'A', stock: 96,  reorderAt: 30, unit: 'EA',  ean: '5901234123457', updatedAt: now },
    { sku: 'SKU-55010', name: 'Safety Helmet · Class E',      loc: 'C-01-08', zone: 'C', stock: 4,   reorderAt: 15, unit: 'EA',  ean: '8711234567895', updatedAt: now },
    { sku: 'SKU-20088', name: 'Thermal Blanket Roll',         loc: 'A-11-01', zone: 'A', stock: 33,  reorderAt: 10, unit: 'EA',  ean: '7612345098765', updatedAt: now },
    { sku: 'SKU-66711', name: 'Brake Pad Set · HD',           loc: 'B-02-04', zone: 'B', stock: 180, reorderAt: 40, unit: 'SET', ean: '4006381333931', updatedAt: now },
    { sku: 'SKU-84330', name: 'LED Beacon Amber',             loc: 'C-03-02', zone: 'C', stock: 22,  reorderAt: 10, unit: 'EA',  ean: '0049022615328', updatedAt: now },
    { sku: 'SKU-50921', name: 'Nitrile Glove Box 100ct',      loc: 'D-01-05', zone: 'D', stock: 70,  reorderAt: 25, unit: 'BOX', ean: '3600540120588', updatedAt: now },
    { sku: 'SKU-41277', name: 'Conveyor Belt V-38',           loc: 'A-05-09', zone: 'A', stock: 9,   reorderAt: 6,  unit: 'M',   updatedAt: now },
    { sku: 'SKU-92310', name: 'Load Strap 4T Ratchet',        loc: 'B-06-03', zone: 'B', stock: 54,  reorderAt: 20, unit: 'EA',  ean: '5055119512313', updatedAt: now },
    { sku: 'SKU-10455', name: 'Industrial Adhesive 500ml',    loc: 'D-02-11', zone: 'D', stock: 15,  reorderAt: 8,  unit: 'BTL', ean: '4026755145113', updatedAt: now },
    { sku: 'SKU-63480', name: 'Pallet Label Spool 1000ct',    loc: 'D-03-01', zone: 'D', stock: 31,  reorderAt: 12, unit: 'ROLL',ean: '0885609040127', updatedAt: now },
  ];
  const existing = new Set((await db.items.toArray()).map((i) => i.sku));
  const missing = seed.filter((r) => !existing.has(r.sku));
  if (missing.length) await db.items.bulkAdd(missing);

  const user = await db.users.get('LT-0482');
  if (!user) {
    await db.users.put({
      operatorId: 'LT-0482', name: 'Rian Kurniawan', role: 'Logistics Officer', shift: '06:00 – 14:00',
    });
  }
}
