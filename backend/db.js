import mongoose from 'mongoose';

/** Connect to the explicitly configured MongoDB database. This app does not use managed MySQL. */
export async function connectMongo() {
  mongoose.set('bufferCommands', false);
  mongoose.set('strictQuery', true);
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn(
      'MONGODB_URI is not set. The API will start, but database routes will return a configuration error.'
    );
    return false;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 7000 });
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
    return true;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    return false;
  }
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}
