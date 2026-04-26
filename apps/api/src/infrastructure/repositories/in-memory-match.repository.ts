/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { IMatchRepository } from '../../domain/ports/match-repository.port';
import { Match } from '../../domain/entities/match.entity';

@Injectable()
export class InMemoryMatchRepository implements IMatchRepository {
  // STATIC yap - tüm instance'lar aynı map'i paylaşsın
  private static matches: Map<number, Match> = new Map();

  async save(match: Match): Promise<void> {
    InMemoryMatchRepository.matches.set(match.id, match);
    console.log(
      `💾 Saved match ${match.id} (${match.homeTeam.fullName} vs ${match.awayTeam.fullName}), Total: ${InMemoryMatchRepository.matches.size}`,
    );
  }

  async findById(id: number): Promise<Match | null> {
    return InMemoryMatchRepository.matches.get(id) || null;
  }

  async findAll(): Promise<Match[]> {
    return Array.from(InMemoryMatchRepository.matches.values());
  }

  async findByDate(date: string): Promise<Match[]> {
    return Array.from(InMemoryMatchRepository.matches.values()).filter(
      (match) => match.date === date,
    );
  }

  async findLiveMatches(): Promise<Match[]> {
    const allMatches = Array.from(InMemoryMatchRepository.matches.values());
    const liveMatches = allMatches.filter((match) => match.isLive === true);
    console.log(
      `🔍 findLiveMatches: Total matches: ${allMatches.length}, Live matches: ${liveMatches.length}`,
    );
    return liveMatches;
  }

  async update(match: Match): Promise<void> {
    if (InMemoryMatchRepository.matches.has(match.id)) {
      InMemoryMatchRepository.matches.set(match.id, match);
    }
  }

  async delete(id: number): Promise<void> {
    InMemoryMatchRepository.matches.delete(id);
  }

  async clear(): Promise<void> {
    InMemoryMatchRepository.matches.clear();
  }
}
