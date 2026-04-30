/* eslint-disable @typescript-eslint/require-await */
// src/infrastructure/repositories/sqlite-match.repository.ts
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { IMatchRepository } from '../../domain/ports/match-repository.port';
import { Match, MatchType } from '../../domain/entities/match.entity';
import { db } from '../database/db.client';
import { matchesTable } from '../database/schema';

@Injectable()
export class SqliteMatchRepository implements IMatchRepository {
  // DB'den gelen raw veriyi (MatchType) Domain entity'ye (Match) çevir
  private toDomain(rawMatch: MatchType): Match {
    return Match.create(rawMatch);
  }

  // Domain entity'yi (Match) DB'ye yazılacak raw veriye (MatchType) çevir
  private toRaw(match: Match): MatchType {
    return match.toJSON();
  }

  // ============ CRUD ============

  async save(match: Match): Promise<void> {
    const raw = this.toRaw(match);
    await db.insert(matchesTable).values(raw);
    console.log(`💾 Maç ${match.id} kaydedildi`);
  }

  async update(match: Match): Promise<void> {
    const raw = this.toRaw(match);

    // UPSERT: Var ise update, yok ise insert
    await db.insert(matchesTable).values(raw).onConflictDoUpdate({
      target: matchesTable.id,
      set: raw,
    });
  }

  async findById(id: number): Promise<Match | null> {
    const result = await db
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.id, id))
      .limit(1);

    return result[0] ? this.toDomain(result[0] as MatchType) : null;
  }

  async findAll(): Promise<Match[]> {
    const results = await db.select().from(matchesTable);
    return results.map((r) => this.toDomain(r as MatchType));
  }

  async findByDate(date: string): Promise<Match[]> {
    const results = await db
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.date, date))
      .orderBy(matchesTable.time);

    return results.map((r) => this.toDomain(r as MatchType));
  }

  async findLiveMatches(): Promise<Match[]> {
    const results = await db
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.isLive, true))
      .orderBy(matchesTable.time);

    return results.map((r) => this.toDomain(r as MatchType));
  }

  async delete(id: number): Promise<void> {
    await db.delete(matchesTable).where(eq(matchesTable.id, id));
  }

  async clear(): Promise<void> {
    await db.delete(matchesTable);
    console.log('🗑️ Tüm maçlar silindi');
  }

  // ============ UTILITY ============

  async upsert(matches: Match): Promise<void> {
    const raw = this.toRaw(matches);
    await db.insert(matchesTable).values(raw).onConflictDoUpdate({
      target: matchesTable.id,
      set: raw,
    });
  }

  async getStats(): Promise<{ total: number; live: number }> {
    const total = await db
      .select({ count: matchesTable.id })
      .from(matchesTable);
    const live = await db
      .select({ count: matchesTable.id })
      .from(matchesTable)
      .where(eq(matchesTable.isLive, true));

    return {
      total: Number(total[0]?.count) || 0,
      live: Number(live[0]?.count) || 0,
    };
  }
}
