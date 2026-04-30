// src/domain/ports/match-repository.port.ts
import { Match } from '../entities/match.entity';

export abstract class IMatchRepository {
  abstract save(match: Match): Promise<void>;
  abstract findById(id: number): Promise<Match | null>;
  abstract findAll(): Promise<Match[]>;
  abstract findByDate(date: string): Promise<Match[]>;
  abstract findLiveMatches(): Promise<Match[]>;
  abstract update(match: Match): Promise<void>;
  abstract upsert(match: Match): Promise<void>;
  abstract delete(id: number): Promise<void>;
  abstract clear(): Promise<void>;
}
