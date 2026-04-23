import type { Item, Transaction, User } from './schemas';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, txt);
  }
  return res.json() as Promise<T>;
}

export const api = {
  items: {
    list:   () => req<Item[]>('/items'),
    get:    (sku: string) => req<Item>(`/items/${encodeURIComponent(sku)}`),
    create: (body: Partial<Item>) => req<Item>('/items', { method: 'POST', body: JSON.stringify(body) }),
    update: (sku: string, patch: Partial<Item>) =>
      req<Item>(`/items/${encodeURIComponent(sku)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    remove: (sku: string) =>
      req<{ deleted: string }>(`/items/${encodeURIComponent(sku)}`, { method: 'DELETE' }),
  },
  tx: {
    list:   () => req<Transaction[]>('/tx'),
    create: (tx: Transaction) => req<Transaction>('/tx', { method: 'POST', body: JSON.stringify(tx) }),
  },
  users: {
    get:    (operatorId: string) =>
      req<User>(`/users/${encodeURIComponent(operatorId)}`),
    upsert: (operatorId: string, patch: Partial<User>) =>
      req<User>(`/users/${encodeURIComponent(operatorId)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  },
};
