// scripts/migrate.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../src/infrastructure/database/db.client';
import * as path from 'path';

function runMigrations() {
  console.log('🔄 Migrations çalıştırılıyor...');

  migrate(db, {
    migrationsFolder: path.join(
      process.cwd(),
      'src/infrastructure/database/migrations',
    ),
  });

  console.log('✅ Migrations tamamlandı!');
  process.exit(0);
}

runMigrations();
