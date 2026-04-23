import { db } from '../db';
import type { User } from '../schemas';
import { api, ApiError } from '../api';

export const usersRepo = {
  /** Try local cache first; fall back to API; mirror on success. */
  get: async (operatorId: string): Promise<User | undefined> => {
    const local = await db.users.get(operatorId);
    if (local) return local;
    try {
      const remote = await api.users.get(operatorId);
      await db.users.put(remote);
      return remote;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return undefined;
      return undefined; // offline: treat as not found
    }
  },

  /** Upsert remote then cache. Throws on API failure so the caller can react. */
  put: async (u: User): Promise<User> => {
    const saved = await api.users.upsert(u.operatorId, u);
    await db.users.put(saved);
    return saved;
  },

  first: async (): Promise<User | undefined> => (await db.users.toArray())[0],
};
