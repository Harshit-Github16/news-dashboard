import mongoose from 'mongoose';

let MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable');
}

// Force DB name to News-Latest
if (!MONGO_URI.includes('/News-Latest')) {
  // Remove any trailing slash and params
  const [base, params] = MONGO_URI.split('?');
  MONGO_URI = base.replace(/\/?$/, '') + '/News-Latest' + (params ? '?' + params : '');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI).then((mongoose) => mongoose).catch((err) => {
      console.log("mongo db error->",err);
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect; 