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
  // Military logistics dummy set. NSN = NATO Stock Number (13 digits, no dashes in OCR).
  const seed = [
    { sku: 'MIL-11001', name: 'Rifle 5.56mm M4 Carbine',         loc: 'ARM-A-01-03', zone: 'A', stock: 48,  reorderAt: 10, unit: 'EA',  ean: '1005013740045', updatedAt: now },
    { sku: 'MIL-11002', name: 'Magazine STANAG 30rd',            loc: 'ARM-A-01-04', zone: 'A', stock: 620, reorderAt: 200,unit: 'EA',  ean: '1005014765001', updatedAt: now },
    { sku: 'MIL-12043', name: 'Ammunition 5.56x45mm M855 Linked',loc: 'AMM-B-03-02', zone: 'B', stock: 18,  reorderAt: 20, unit: 'CAN', ean: '1305013510116', updatedAt: now },
    { sku: 'MIL-12044', name: 'Ammunition 9x19mm Ball M882',     loc: 'AMM-B-03-05', zone: 'B', stock: 42,  reorderAt: 15, unit: 'CAN', ean: '1305012551437', updatedAt: now },
    { sku: 'MIL-13018', name: 'Grenade Smoke M18 Violet',        loc: 'AMM-B-04-01', zone: 'B', stock: 24,  reorderAt: 12, unit: 'EA',  ean: '1330011041720', updatedAt: now },
    { sku: 'MIL-20115', name: 'Helmet ACH Size M',               loc: 'GEA-C-02-07', zone: 'C', stock: 72,  reorderAt: 20, unit: 'EA',  ean: '8470015207350', updatedAt: now },
    { sku: 'MIL-20211', name: 'Body Armor IOTV Size L',          loc: 'GEA-C-02-09', zone: 'C', stock: 9,   reorderAt: 10, unit: 'EA',  ean: '8470015522040', updatedAt: now },
    { sku: 'MIL-20350', name: 'Night Vision PVS-14 Monocular',   loc: 'OPT-C-05-02', zone: 'C', stock: 14,  reorderAt: 6,  unit: 'EA',  ean: '5855014322137', updatedAt: now },
    { sku: 'MIL-30022', name: 'Radio Handheld AN/PRC-152',       loc: 'COM-D-01-01', zone: 'D', stock: 18,  reorderAt: 8,  unit: 'EA',  ean: '5820015525005', updatedAt: now },
    { sku: 'MIL-30100', name: 'Battery BA-5590 Lithium',         loc: 'COM-D-01-12', zone: 'D', stock: 130, reorderAt: 40, unit: 'EA',  ean: '6135011764177', updatedAt: now },
    { sku: 'MIL-40005', name: 'MRE Case Menu Assorted 12ct',     loc: 'SUP-E-02-04', zone: 'E', stock: 88,  reorderAt: 30, unit: 'BOX', ean: '8970012985005', updatedAt: now },
    { sku: 'MIL-40102', name: 'IFAK Individual First Aid Kit',   loc: 'MED-E-03-07', zone: 'E', stock: 35,  reorderAt: 20, unit: 'EA',  ean: '6545015392465', updatedAt: now },
  ];
  const existing = new Set((await db.items.toArray()).map((i) => i.sku));
  const missing = seed.filter((r) => !existing.has(r.sku));
  if (missing.length) await db.items.bulkAdd(missing);

  const user = await db.users.get('LT-0482');
  if (!user) {
    await db.users.put({
      operatorId: 'LT-0482', name: 'SGT R. Kurniawan', role: 'S-4 Logistics NCO', shift: '06:00 – 14:00',
    });
  }
}
