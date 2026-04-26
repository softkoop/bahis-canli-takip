/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/require-await */
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { ILiveDataProvider } from '../../domain/ports/live-data-provider.port';
import { Match } from '../../domain/entities/match.entity';
import { MockStatsGenerator } from '../generators/mock-stats-generator.service';
import { MATCH_REPOSITORY_TOKEN } from '../../domain/ports/tokens';
import type { IMatchRepository } from 'src/domain/ports/match-repository.port';

@Injectable()
export class MockLiveDataAdapter implements ILiveDataProvider, OnModuleInit {
  private liveUpdatesSubject = new Subject<Match[]>();
  private updateInterval!: NodeJS.Timeout;

  constructor(
    private readonly statsGenerator: MockStatsGenerator,
    @Inject(MATCH_REPOSITORY_TOKEN)
    private readonly matchRepository: IMatchRepository,
  ) {}

  async onModuleInit() {
    // Her 5 saniyede bir canlı maçları güncelle
    this.updateInterval = setInterval(async () => {
      await this.updateLiveMatches();
    }, 5000);
  }

  private async updateLiveMatches() {
    const liveMatches = await this.matchRepository.findLiveMatches();

    if (liveMatches.length === 0) return;

    const updatedMatches: Match[] = [];

    for (const match of liveMatches) {
      if (match.minute && match.minute >= 90) {
        // Maç bitti, canlı statüsünü kaldır
        const finishedMatch = new Match(
          match.id,
          match.time,
          match.date,
          match.homeTeam,
          match.awayTeam,
          match.odds,
          match.confidence,
          match.betType,
          match.betOdd,
          false, // isLive false
          match.league,
          match.flag,
          match.score,
          90,
          match.stats,
        );
        await this.matchRepository.save(finishedMatch);
        updatedMatches.push(finishedMatch);
        continue;
      }

      // İstatistikleri güncelle
      const currentStats = match.stats;
      if (currentStats) {
        const { newStats, goalScorer } =
          this.statsGenerator.updateMatchStats(currentStats);

        // Skoru güncelle
        let newScore = match.score || { home: 0, away: 0 };
        if (goalScorer === 'home') {
          newScore = { ...newScore, home: newScore.home + 1 };
        } else if (goalScorer === 'away') {
          newScore = { ...newScore, away: newScore.away + 1 };
        }

        const updatedMatch = new Match(
          match.id,
          match.time,
          match.date,
          match.homeTeam,
          match.awayTeam,
          match.odds,
          match.confidence,
          match.betType,
          match.betOdd,
          true,
          match.league,
          match.flag,
          newScore,
          newStats.matchDuration,
          newStats,
        );

        await this.matchRepository.save(updatedMatch);
        updatedMatches.push(updatedMatch);
      }
    }

    if (updatedMatches.length > 0) {
      this.liveUpdatesSubject.next(updatedMatches);
    }
  }

  getLiveMatchUpdates(): Observable<Match[]> {
    return this.liveUpdatesSubject.asObservable();
  }

  async getMatchStats(matchId: number): Promise<Match | null> {
    const match = await this.matchRepository.findById(matchId);
    if (match && match.isLive) {
      return match;
    }
    return null;
  }

  async getCurrentLiveMatches(): Promise<Match[]> {
    return await this.matchRepository.findLiveMatches();
  }

  onModuleDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
