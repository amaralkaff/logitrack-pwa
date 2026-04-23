import { db } from '../db';
import type { User } from '../schemas';

export const usersRepo = {
  get: (operatorId: string) => db.users.get(operatorId),
  put: (u: User) => db.users.put(u),
  first: async (): Promise<User | undefined> => (await db.users.toArray())[0],
};
