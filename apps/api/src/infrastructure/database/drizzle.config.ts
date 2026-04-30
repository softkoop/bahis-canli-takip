// src/infrastructure/database/drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import * as path from 'path';

export default defineConfig({
  schema: './src/infrastructure/database/schema.ts',
  out: './src/infrastructure/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: path.join(process.cwd(), 'data', 'matches.sqlite'),
  },
});
