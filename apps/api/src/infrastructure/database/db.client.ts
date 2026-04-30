// src/infrastructure/database/db.client.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'matches.sqlite');

// data klasörü yoksa oluştur
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite);

export default db;
