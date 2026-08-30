const mongoose = require('mongoose');

// Vercel runs this file inside a serverless function. Each cold start can
// invoke connectDB() again, and without caching this creates a fresh
// connection (or connection attempt) on every single request, which quickly
// exhausts MongoDB Atlas's connection limit. Caching the promise means all
// invocations in the same warm lambda instance reuse one connection.
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI)
      .then((mongooseInstance) => {
        console.log('✅ MongoDB Connected');
        return mongooseInstance;
      })
      .catch((error) => {
        console.error('❌ DB Connection Error:', error.message);
        cached.promise = null; // allow retry on next invocation
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Swallow here so the server still boots and returns proper API errors
    // instead of crashing the whole function; routes will fail individually.
  }

  return cached.conn;
};

module.exports = connectDB;
