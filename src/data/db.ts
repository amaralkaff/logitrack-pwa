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
      items:        '&sku, name, loc, zone, updatedAt, stock',
      transactions: '&localId, txId, sku, dir, createdAt, syncedAt, operatorId',
      syncQueue:    '++id, kind, nextTryAt',
      users:        '&operatorId',
    });
  }
}

export const db = new LogiTrackDB();
