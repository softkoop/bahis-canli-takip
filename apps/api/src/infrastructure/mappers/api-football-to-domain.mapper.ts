import { Injectable } from '@nestjs/common';
import { Match } from '../../domain/entities/match.entity';
import { MatchStats } from '../../domain/value-objects/match-stats.value-objects';
import { TeamStats } from '../../domain/value-objects/team-stats.value-objects';
import { TeamName } from '../../domain/value-objects/team-name.value-object';
import { Odds } from '../../domain/value-objects/odds.value-object';
import {
  ApiFootballResponse,
  FixtureItem,
  FixtureStatisticsResponse,
  TeamStatistics,
  StatisticValue,
} from '../clients/api-football.types';

@Injectable()
export class ApiFootballToDomainMapper {
  /**
   * Fikstür / Canlı maç response'unu Match entity'lerine çevirir
   */
  mapFixturesToMatches(
    apiResponse: ApiFootballResponse<FixtureItem[]>,
  ): Match[] {
    if (!apiResponse.response) return [];

    return apiResponse.response.map((item: FixtureItem) => {
      const fixture = item.fixture;
      const teams = item.teams;
      const goals = item.goals;
      const league = item.league;

      const isLive =
        fixture.status.short === '1H' ||
        fixture.status.short === '2H' ||
        fixture.status.short === 'HT';
      const minute = isLive ? (fixture.status.elapsed ?? undefined) : undefined;

      return new Match(
        fixture.id,
        this.extractTime(fixture.date),
        this.extractDate(fixture.date),
        TeamName.create(
          teams.home.name,
          teams.home.name,
          this.extractLogoCode(teams.home.logo),
        ),
        TeamName.create(
          teams.away.name,
          teams.away.name,
          this.extractLogoCode(teams.away.logo),
        ),
        Odds.create({ home: 0, draw: 0, away: 0 }),
        null,
        null,
        null,
        isLive,
        league.name,
        league.country,
        { home: goals.home ?? 0, away: goals.away ?? 0 },
        minute,
        undefined,
      );
    });
  }

  /**
   * İstatistik response'unu MatchStats entity'sine çevirir
   */
  mapStatisticsToMatchStats(
    statisticsResponse: FixtureStatisticsResponse,
  ): MatchStats {
    if (
      !statisticsResponse.response ||
      statisticsResponse.response.length < 2
    ) {
      return new MatchStats(
        new TeamStats(0, 0, 0, 0, 0),
        new TeamStats(0, 0, 0, 0, 0),
        0,
        'first',
      );
    }

    const homeStats = statisticsResponse.response[0];
    const awayStats = statisticsResponse.response[1];

    const getStatValue = (stats: TeamStatistics, statType: string): number => {
      const stat = stats.statistics.find(
        (s: StatisticValue) => s.type === statType,
      );
      if (!stat || stat.value === null) return 0;

      if (statType === 'Ball Possession' && typeof stat.value === 'string') {
        return parseInt(stat.value.replace('%', ''));
      }

      return typeof stat.value === 'number'
        ? stat.value
        : parseInt(stat.value) || 0;
    };

    // Tehlikeli atak = Shots on Goal + Shots insidebox + Corner Kicks
    const getDangerousAttacks = (stats: TeamStatistics): number => {
      const shotsOnGoal = getStatValue(stats, 'Shots on Goal');
      const shotsInsideBox = getStatValue(stats, 'Shots insidebox');
      const corners = getStatValue(stats, 'Corner Kicks');
      return shotsOnGoal + shotsInsideBox + corners;
    };

    return new MatchStats(
      new TeamStats(
        getStatValue(homeStats, 'Ball Possession'),
        getStatValue(homeStats, 'Total Shots'),
        getStatValue(homeStats, 'Shots on Goal'),
        getDangerousAttacks(homeStats),
        getStatValue(homeStats, 'Corner Kicks'),
      ),
      new TeamStats(
        getStatValue(awayStats, 'Ball Possession'),
        getStatValue(awayStats, 'Total Shots'),
        getStatValue(awayStats, 'Shots on Goal'),
        getDangerousAttacks(awayStats),
        getStatValue(awayStats, 'Corner Kicks'),
      ),
      0,
      'first',
    );
  }

  /**
   * Canlı güncelleme için mevcut Match'i yeni istatistiklerle günceller
   */
  updateMatchWithStats(
    existingMatch: Match,
    statisticsResponse: FixtureStatisticsResponse,
    minute: number,
  ): Match {
    const newStats = this.mapStatisticsToMatchStats(statisticsResponse);

    return new Match(
      existingMatch.id,
      existingMatch.time,
      existingMatch.date,
      existingMatch.homeTeam,
      existingMatch.awayTeam,
      existingMatch.odds,
      existingMatch.confidence,
      existingMatch.betType,
      existingMatch.betOdd,
      existingMatch.isLive,
      existingMatch.league,
      existingMatch.flag,
      existingMatch.score,
      minute,
      newStats,
    );
  }

  private extractDate(dateTimeStr: string): string {
    return dateTimeStr.split('T')[0];
  }

  private extractTime(dateTimeStr: string): string {
    return dateTimeStr.split('T')[1]?.substring(0, 5) || '00:00';
  }

  private extractLogoCode(logoUrl: string): string {
    const match = logoUrl.match(/\/teams\/(\d+)\.png$/);
    return match ? match[1] : 'XXX';
  }
}
