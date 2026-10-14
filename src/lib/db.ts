import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDb(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (cached.conn) {
    return cached.conn;
  }

  let connectionPromise = cached.promise;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    cached.promise = connectionPromise;
  }

  try {
    cached.conn = await connectionPromise;
    return cached.conn;
  } catch (error) {
    if (cached.promise === connectionPromise) {
      cached.promise = null;
    }
    throw error;
  }
}

export default connectDb;
