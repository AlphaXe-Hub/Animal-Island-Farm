import mongoose from 'mongoose';
import { MONGODB_URI } from './config.js';

export async function connectDb(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI);
}
