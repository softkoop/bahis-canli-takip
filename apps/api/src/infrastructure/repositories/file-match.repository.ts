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

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'matches.json');

    // Global instance kontrolü
    if (!globalMatches) {
      globalMatches = new Map();
      this.matches = globalMatches; // ← ÖNCE matches'i ata!
      this.loadFromFile(); // ← SONRA yükle!
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

  async save(match: Match): Promise<void> {
    this.matches.set(match.id, match);
    this.saveToFile();
  }

  async findById(id: number): Promise<Match | null> {
    const match = this.matches.get(id);
    return match || null;
  }

  async findAll(): Promise<Match[]> {
    return Array.from(this.matches.values());
  }

  async findByDate(date: string): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      (match) => match.date === date,
    );
  }

  async findLiveMatches(): Promise<Match[]> {
    const liveMatches = Array.from(this.matches.values()).filter(
      (match) => match.isLive === true,
    );
    return liveMatches;
  }

  async update(match: Match): Promise<void> {
    if (this.matches.has(match.id)) {
      this.matches.set(match.id, match);
      this.saveToFile();
    }
  }

  async delete(id: number): Promise<void> {
    this.matches.delete(id);
    this.saveToFile();
  }

  async clear(): Promise<void> {
    this.matches.clear();
    this.saveToFile();
  }
}
