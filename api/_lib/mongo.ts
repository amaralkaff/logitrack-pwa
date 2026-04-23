import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var __mongoConn: Promise<typeof mongoose> | undefined;
}

export function connectMongo(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI env var missing');
  if (!global.__mongoConn) {
    global.__mongoConn = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB ?? 'logitrack',
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 5,
    });
  }
  return global.__mongoConn;
}
