import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = mongoose || { connect: null, disconnect: null };

export async function connectToDatabase() {
  if (cached.connect) {
    return cached.connect;
  }
}
