import mongoose from "mongoose";

// اتصال یک‌بار ساخته و بین درخواست‌ها (و بین HMR در حالت dev) نگه داشته می‌شود؛
// قبلاً در حالت «در حال اتصال» چند اتصال هم‌زمان باز می‌شد.
let cached = global._mongooseConn;
if (!cached) cached = global._mongooseConn = { conn: null, promise: null };

async function ConnectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 })
      .catch((e) => { cached.promise = null; throw e; });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default ConnectDB;
