import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { ILiveDataProvider } from '../../domain/ports/live-data-provider.port';
import { Match } from '../../domain/entities/match.entity';
import { ApiFootballClient } from '../clients/api-football.client';
import { ApiFootballToDomainMapper } from '../mappers/api-football-to-domain.mapper';
import { MATCH_REPOSITORY_TOKEN } from '../../domain/ports/tokens';
import { Inject } from '@nestjs/common';
import type { IMatchRepository } from '../../domain/ports/match-repository.port';
import { FixtureItem } from '../clients/api-football.types';

@Injectable()
export class ApiFootballLiveAdapter implements ILiveDataProvider {
  private liveUpdatesSubject = new Subject<Match[]>();

  constructor(
    private readonly apiClient: ApiFootballClient,
    private readonly mapper: ApiFootballToDomainMapper,
    @Inject(MATCH_REPOSITORY_TOKEN)
    private readonly matchRepository: IMatchRepository,
  ) {}

  getLiveMatchUpdates(): Observable<Match[]> {
    return this.liveUpdatesSubject.asObservable();
  }

  async getMatchStats(matchId: number): Promise<Match | null> {
    const match = await this.matchRepository.findById(matchId);
    if (!match?.isLive) return null;

    try {
      const response = await this.apiClient.getFixtureStatistics(matchId);

      if (response.results === 0 || !response.response) {
        console.log(`⚠️ Maç ${matchId} için istatistik yok`);
        return null;
      }

      // Dakikayı güncelle - tip güvenli versiyon
      const fixtureResponse = await this.apiClient.getFixtures({ live: 'all' });
      const liveMatch = fixtureResponse.response?.find(
        (f: FixtureItem) => f.fixture.id === matchId, // ← any yerine FixtureItem tipi
      );
      const minute = liveMatch?.fixture.status.elapsed ?? match.minute ?? 0;

      const updatedMatch = this.mapper.updateMatchWithStats(
        match,
        response,
        minute,
      );
      return updatedMatch;
    } catch (error) {
      console.error(`Maç ${matchId} istatistik alınamadı:`, error);
      return null;
    }
  }

  async getCurrentLiveMatches(): Promise<Match[]> {
    const response = await this.apiClient.getFixtures({ live: 'all' });
    const matches = this.mapper.mapFixturesToMatches(response);

    // Cache'e kaydet
    for (const match of matches) {
      await this.matchRepository.save(match);
    }

    return matches;
  }

  emitLiveUpdate(updatedMatch: Match): void {
    this.liveUpdatesSubject.next([updatedMatch]);
  }
}
