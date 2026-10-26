import mongoose from 'mongoose';

/**
 * MongoDB Database Connection Handler
 * 
 * Supports both local MongoDB instances and cloud MongoDB Atlas clusters.
 * Configured with connection timeout and robust event listeners.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulseplan_db';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} (Database: ${conn.connection.name})`);

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB Error]', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected from database');
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Failed]: ${error.message}`);
    console.error('[MongoDB Setup Tip]: Ensure MongoDB Server is running locally on 127.0.0.1:27017, or specify a valid MongoDB Atlas URI in server/.env (MONGODB_URI=mongodb+srv://...)');
    // Note: In development we log clearly so the server can remain accessible
    throw error;
  }
}
