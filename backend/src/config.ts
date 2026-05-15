import 'dotenv/config';

export const PORT = Number(process.env.PORT) || 3000;
export const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/animal-island-farm';
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
export const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
