import { z } from 'zod';

export const Direction = z.enum(['in', 'out']);
export type Direction = z.infer<typeof Direction>;

export const Source = z.enum(['ocr', 'manual']);
export type Source = z.infer<typeof Source>;

export const Condition = z.enum(['good', 'damaged', 'missing']);
export type Condition = z.infer<typeof Condition>;

export const Item = z.object({
  sku: z.string(),
  name: z.string(),
  ean: z.string().optional(),
  loc: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  stock: z.number().int().nonnegative(),
  reorderAt: z.number().int().nonnegative().default(0),
  unit: z.string().default('EA'),
  zone: z.string().optional(),
  imageUrl: z.string().optional(),
  updatedAt: z.number().int(),
});
export type Item = z.infer<typeof Item>;

export const Transaction = z.object({
  localId: z.string(),
  txId: z.string().optional(), // server-assigned on sync
  sku: z.string(),
  qty: z.number().int(),
  dir: Direction,
  source: Source,
  operatorId: z.string(),
  location: z.string().optional(),
  condition: Condition.default('good'),
  batch: z.string().optional(),
  createdAt: z.number().int(),
  syncedAt: z.number().int().optional(),
});
export type Transaction = z.infer<typeof Transaction>;

export const SyncJob = z.object({
  id: z.number().int().optional(),
  kind: z.enum(['tx.upload']),
  payload: z.unknown(),
  attempts: z.number().int().default(0),
  nextTryAt: z.number().int().default(0),
  lastError: z.string().optional(),
});
export type SyncJob = z.infer<typeof SyncJob>;

export const User = z.object({
  operatorId: z.string(),
  name: z.string(),
  role: z.string().default('Operator'),
  shift: z.string().optional(),
  location: z.string().optional(),
  pinHash: z.string().optional(),
});
export type User = z.infer<typeof User>;
