// src/infrastructure/database/schema.ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import type { MatchType } from '../../domain/entities/match.entity';

// Yeni Drizzle versiyonu için doğru syntax
export const matchesTable = sqliteTable('matches', {
  id: integer('id').primaryKey(),
  time: text('time').notNull(),
  date: text('date').notNull(),

  // JSON kolonlar
  homeTeam: text('homeTeam', { mode: 'json' })
    .$type<MatchType['homeTeam']>()
    .notNull(),
  awayTeam: text('awayTeam', { mode: 'json' })
    .$type<MatchType['awayTeam']>()
    .notNull(),
  odds: text('odds', { mode: 'json' }).$type<MatchType['odds']>().notNull(),

  // Basit alanlar
  confidence: text('confidence'),
  betType: text('betType'),
  betOdd: integer('betOdd'),
  isLive: integer('isLive', { mode: 'boolean' }).notNull().default(false),
  league: text('league'),
  flag: text('flag'),

  // Opsiyonel JSON
  score: text('score', { mode: 'json' }).$type<{
    home: number;
    away: number;
  }>(),
  minute: integer('minute'),
  stats: text('stats', { mode: 'json' }).$type<MatchType['stats']>(),
});
