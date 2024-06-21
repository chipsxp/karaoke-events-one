import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose || { connect: null, disconnect: null };

export async function connectToDatabase() {
  if (cached.connect) {
    return cached.connect;
  }
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  cached.promise =
    cached.promise ||
    mongoose.connect(MONGODB_URI, {
      dbName: "karaoke-events",
      bufferCommands: false,
    });

  cached.connect = await cached.promise;
  return cached.connect;
}
