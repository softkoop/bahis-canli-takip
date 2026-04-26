import { Match } from '../entities/match.entity';

export interface IMatchRepository {
  save(match: Match): Promise<void>;
  findById(id: number): Promise<Match | null>;
  findAll(): Promise<Match[]>;
  findByDate(date: string): Promise<Match[]>;
  findLiveMatches(): Promise<Match[]>;
  update(match: Match): Promise<void>;
  delete(id: number): Promise<void>;
  clear(): Promise<void>; // ← EKLE
}
