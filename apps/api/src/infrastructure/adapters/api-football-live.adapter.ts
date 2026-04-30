import { Inject, Injectable } from '@nestjs/common';
import { ILiveDataProvider } from '../../domain/ports/live-data-provider.port';
import { Match } from '../../domain/entities/match.entity';
import { ApiFootballClient } from '../clients/api-football.client';
import { ApiFootballToDomainMapper } from '../mappers/api-football-to-domain.mapper';

import { IMatchRepository } from '../../domain/ports/match-repository.port';
import { FixtureItem } from '../clients/api-football.types';

@Injectable()
export class ApiFootballLiveAdapter implements ILiveDataProvider {
  constructor(
    private readonly apiClient: ApiFootballClient,
    private readonly mapper: ApiFootballToDomainMapper,
    @Inject(IMatchRepository)
    private readonly matchRepository: IMatchRepository,
  ) {}

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

    return matches;
  }
}
