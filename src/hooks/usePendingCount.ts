import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/data/db';

export function usePendingCount(): number {
  const count = useLiveQuery(() => db.transactions.filter((t) => !t.syncedAt).count(), [], 0);
  return count ?? 0;
}
