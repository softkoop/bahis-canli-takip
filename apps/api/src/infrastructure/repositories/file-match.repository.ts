/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IMatchRepository } from '../../domain/ports/match-repository.port';
import { Match } from '../../domain/entities/match.entity';

// 🔴 GLOBAL - Modül dışında tek instance
let globalMatches: Map<number, Match> | null = null;

@Injectable()
export class FileMatchRepository implements IMatchRepository {
  private readonly dataPath: string;
  private matches: Map<number, Match>;
  private pendingUpdates: Map<number, Match> = new Map();
  private flushScheduled = false;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'matches.json');

    if (!globalMatches) {
      globalMatches = new Map();
      this.matches = globalMatches;
      this.loadFromFile();
    } else {
      this.matches = globalMatches;
    }
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf-8');
        const parsed = JSON.parse(data);

        this.matches.clear();
        for (const matchData of parsed) {
          const match = Match.create(matchData);
          this.matches.set(match.id, match);
        }

        console.log(`📂 Loaded ${this.matches.size} matches from file`);
      } else {
        console.log('📂 No existing data file, starting fresh');
        this.saveToFile();
      }
    } catch (error) {
      console.error('Error loading from file:', error);
      this.matches.clear();
    }
  }

  private saveToFile() {
    try {
      const data = Array.from(this.matches.values()).map((match) =>
        match.toJSON(),
      );
      const dir = path.dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving to file:', error);
    }
  }

  // ============ BATCH UPDATE METHODS ============

  async save(match: Match): Promise<void> {
    this.matches.set(match.id, match);
    this.saveToFile(); // Save hemen yaz (yeni maç kritik)
  }

  async update(match: Match): Promise<void> {
    if (this.matches.has(match.id)) {
      this.pendingUpdates.set(match.id, match);
      this.scheduleFlush();
    }
  }
  async upsert(match: Match): Promise<void> {
    if (this.matches.has(match.id)) {
      this.pendingUpdates.set(match.id, match);
      this.scheduleFlush();
    }
  }

  private scheduleFlush() {
    if (this.flushScheduled) return;
    this.flushScheduled = true;

    // Event loop'un bir sonraki tick'inde flush yap
    setImmediate(() => {
      this.flush();
      this.flushScheduled = false;
    });
  }

  private flush() {
    if (this.pendingUpdates.size === 0) return;

    console.log(`💾 Flushing ${this.pendingUpdates.size} updates to file`);

    for (const [id, match] of this.pendingUpdates) {
      this.matches.set(id, match);
    }
    this.pendingUpdates.clear();
    this.saveToFile();
  }

  async flushNow(): Promise<void> {
    if (this.pendingUpdates.size > 0) {
      this.flush();
      this.flushScheduled = false;
    }
  }

  // ============ READ METHODS ============

  async findById(id: number): Promise<Match | null> {
    // Önce pending update'leri kontrol et
    if (this.pendingUpdates.has(id)) {
      return this.pendingUpdates.get(id) || null;
    }
    return this.matches.get(id) || null;
  }

  async findAll(): Promise<Match[]> {
    // Aktif maçlar + pending update'leri birleştir
    const allMatches = new Map(this.matches);
    for (const [id, match] of this.pendingUpdates) {
      allMatches.set(id, match);
    }
    return Array.from(allMatches.values());
  }

  async findByDate(date: string): Promise<Match[]> {
    const allMatches = await this.findAll();
    return allMatches.filter((match) => match.date === date);
  }

  async findLiveMatches(): Promise<Match[]> {
    const allMatches = await this.findAll();
    return allMatches.filter((match) => match.isLive === true);
  }

  // ============ DELETE METHODS ============

  async delete(id: number): Promise<void> {
    this.pendingUpdates.delete(id);
    this.matches.delete(id);
    this.scheduleFlush();
  }

  async clear(): Promise<void> {
    this.matches.clear();
    this.pendingUpdates.clear();
    this.saveToFile();
  }

  // ============ UTILITY ============

  async onModuleDestroy() {
    // Uygulama kapanırken bekleyen tüm güncellemeleri yaz
    await this.flushNow();
  }
}
