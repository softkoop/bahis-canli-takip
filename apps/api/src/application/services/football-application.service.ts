/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { MatchDomainService } from '../../domain/services/match.service';
import { DomainToFrontendMapper } from '../../infrastructure/mappers/domain-to-frontend.mapper';
import { ApiResponseMapper } from '../../infrastructure/mappers/api-response.mapper';
import { MatchFilterDto } from '../dto/match.dto';

@Injectable()
export class FootballApplicationService {
  constructor(
    private readonly matchDomainService: MatchDomainService,
    private readonly frontendMapper: DomainToFrontendMapper,
    private readonly responseMapper: ApiResponseMapper,
  ) {}

  async getWeeklyFixtures() {
    try {
      const fixtures = await this.matchDomainService.getWeeklyFixtures();
      const frontendMatches = this.frontendMapper.mapMatches(fixtures);
      const leagueGroups = this.frontendMapper.mapLeagueGroups(fixtures);

      return this.responseMapper.success({
        matches: frontendMatches,
        groupedByLeague: leagueGroups,
        total: frontendMatches.length,
      });
    } catch (error) {
      return this.responseMapper.error('Fikstür yüklenirken hata oluştu', [
        (error as Error).message,
      ]);
    }
  }

  async getMatchesByDate(date: string) {
    try {
      const matches = await this.matchDomainService.getMatchesByDate(date);
      const frontendMatches = this.frontendMapper.mapMatches(matches);
      const leagueGroups = this.frontendMapper.mapLeagueGroups(matches);

      return this.responseMapper.success({
        date,
        matches: frontendMatches,
        groupedByLeague: leagueGroups,
        total: frontendMatches.length,
      });
    } catch (error) {
      return this.responseMapper.error('Maçlar yüklenirken hata oluştu', [
        (error as Error).message,
      ]);
    }
  }

  async getLiveMatches() {
    try {
      const liveMatches = await this.matchDomainService.getLiveMatches();
      const frontendMatches = this.frontendMapper.mapMatches(liveMatches);

      return this.responseMapper.success({
        matches: frontendMatches,
        total: frontendMatches.length,
      });
    } catch (error) {
      return this.responseMapper.error('Canlı maçlar yüklenirken hata oluştu', [
        (error as Error).message,
      ]);
    }
  }

  async getMatchStats(matchId: number) {
    try {
      const match = await this.matchDomainService.getMatchStats(matchId);
      if (!match) {
        return this.responseMapper.error('Maç bulunamadı');
      }

      const frontendMatch = this.frontendMapper.mapMatch(match);
      return this.responseMapper.success(frontendMatch);
    } catch (error) {
      return this.responseMapper.error(
        'Maç istatistikleri yüklenirken hata oluştu',
        [(error as Error).message],
      );
    }
  }

  async filterMatches(filters: MatchFilterDto) {
    try {
      let matches = await this.matchDomainService.getMatchesByDate(
        filters.date || new Date().toISOString().split('T')[0],
      );

      // Filtreleme işlemleri
      if (filters.isLive !== undefined) {
        matches = matches.filter((m) => m.isLive === filters.isLive);
      }

      if (filters.league && filters.league !== 'all') {
        matches = matches.filter((m) => m.league === filters.league);
      }

      if (filters.searchText) {
        const search = filters.searchText.toLowerCase();
        matches = matches.filter(
          (m) =>
            m.homeTeam.fullName.toLowerCase().includes(search) ||
            m.awayTeam.fullName.toLowerCase().includes(search) ||
            m.league?.toLowerCase().includes(search),
        );
      }

      // Pagination
      const start = (filters.page - 1) * filters.limit;
      const end = start + filters.limit;
      const paginatedMatches = matches.slice(start, end);

      const frontendMatches = this.frontendMapper.mapMatches(paginatedMatches);

      return this.responseMapper.paginated(
        frontendMatches,
        matches.length,
        filters.page,
        filters.limit,
      );
    } catch (error) {
      return this.responseMapper.error('Filtreleme yapılırken hata oluştu', [
        (error as Error).message,
      ]);
    }
  }

  async getDateList() {
    try {
      const dates = [];
      const today = new Date();

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const days = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT'];

        dates.push({
          date: date.toISOString().split('T')[0],
          dayName: days[date.getDay()],
          dayNumber: date.getDate(),
        });
      }

      return this.responseMapper.success(dates);
    } catch (error) {
      return this.responseMapper.error(
        'Tarih listesi oluşturulurken hata oluştu',
        [(error as Error).message],
      );
    }
  }

  async getLeagues() {
    try {
      const fixtures = await this.matchDomainService.getWeeklyFixtures();
      const leagues = [
        ...new Set(fixtures.map((m) => m.league).filter((l) => l)),
      ];

      const leagueList = leagues.map((league) => ({
        name: league,
        flag: fixtures.find((m) => m.league === league)?.flag || '',
      }));

      return this.responseMapper.success(leagueList);
    } catch (error) {
      return this.responseMapper.error('Ligler yüklenirken hata oluştu', [
        (error as Error).message,
      ]);
    }
  }
}
