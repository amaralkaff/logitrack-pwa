import { db } from '../db';
import type { SyncJob } from '../schemas';

export const syncRepo = {
  enqueue: (job: Omit<SyncJob, 'id'>) => db.syncQueue.add(job as SyncJob),
  list:    () => db.syncQueue.orderBy('nextTryAt').toArray(),
  count:   () => db.syncQueue.count(),
  remove:  (id: number) => db.syncQueue.delete(id),
  markFailure: async (id: number, error: string) => {
    await db.syncQueue.where('id').equals(id).modify((j) => {
      j.attempts = (j.attempts ?? 0) + 1;
      j.lastError = error;
      j.nextTryAt = Date.now() + Math.min(60_000 * 2 ** j.attempts, 15 * 60_000);
    });
  },
};
