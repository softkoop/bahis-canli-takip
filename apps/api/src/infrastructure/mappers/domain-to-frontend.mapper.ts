import { Injectable } from '@nestjs/common';
import { Match } from '../../domain/entities/match.entity';
import { MatchStats } from '../../domain/value-objects/match-stats.value-objects';

// Frontend'in beklediği interface'ler (senin mock-data-api'ndaki gibi)
export interface FrontendTeam {
  name: string;
  shortName: string;
  logo: string;
}

export interface FrontendOdds {
  '1': number | string;
  X: number | string;
  '2': number | string;
}

export interface FrontendTeamStats {
  possession: number;
  shots: number;
  accurateShots: number;
  dangerousAttacks: number;
  corners: number;
}

export interface FrontendMatchStats {
  home: FrontendTeamStats;
  away: FrontendTeamStats;
  matchDuration: number;
  currentHalf: 'first' | 'second';
}

export interface FrontendMatch {
  id: number;
  time: string;
  homeTeam: FrontendTeam;
  awayTeam: FrontendTeam;
  odds: FrontendOdds;
  confidence: string | null;
  betType: string | null;
  betOdd: number | null;
  isLive: boolean;
  league: string | null;
  flag: string | null;
  score?: {
    home: number;
    away: number;
  };
  minute?: number;
  date?: string;
  stats?: FrontendMatchStats;
}

export interface FrontendLeagueGroup {
  league: string;
  flag: string;
  matches: FrontendMatch[];
}

@Injectable()
export class DomainToFrontendMapper {
  mapTeam(domainTeam: {
    fullName: string;
    shortName: string;
    logo: string;
  }): FrontendTeam {
    return {
      name: domainTeam.fullName,
      shortName: domainTeam.shortName,
      logo: domainTeam.logo,
    };
  }

  mapOdds(domainOdds: {
    home: number | string;
    draw: number | string;
    away: number | string;
  }): FrontendOdds {
    return {
      '1': domainOdds.home,
      X: domainOdds.draw,
      '2': domainOdds.away,
    };
  }

  mapTeamStats(domainStats: {
    possession: number;
    shots: number;
    accurateShots: number;
    dangerousAttacks: number;
    corners: number;
  }): FrontendTeamStats {
    return {
      possession: domainStats.possession,
      shots: domainStats.shots,
      accurateShots: domainStats.accurateShots,
      dangerousAttacks: domainStats.dangerousAttacks,
      corners: domainStats.corners,
    };
  }

  mapMatchStats(domainStats: MatchStats): FrontendMatchStats {
    return {
      home: this.mapTeamStats(domainStats.home),
      away: this.mapTeamStats(domainStats.away),
      matchDuration: domainStats.matchDuration,
      currentHalf: domainStats.currentHalf,
    };
  }

  mapMatch(domainMatch: Match): FrontendMatch {
    const frontendMatch: FrontendMatch = {
      id: domainMatch.id,
      time: domainMatch.time,
      homeTeam: this.mapTeam(domainMatch.homeTeam),
      awayTeam: this.mapTeam(domainMatch.awayTeam),
      odds: this.mapOdds(domainMatch.odds),
      confidence: domainMatch.confidence,
      betType: domainMatch.betType,
      betOdd: domainMatch.betOdd,
      isLive: domainMatch.isLive,
      league: domainMatch.league,
      flag: domainMatch.flag,
      date: domainMatch.date,
    };

    if (domainMatch.score) {
      frontendMatch.score = domainMatch.score;
    }

    if (domainMatch.minute !== undefined) {
      frontendMatch.minute = domainMatch.minute;
    }

    if (domainMatch.stats) {
      frontendMatch.stats = this.mapMatchStats(domainMatch.stats);
    }

    return frontendMatch;
  }

  mapMatches(domainMatches: Match[]): FrontendMatch[] {
    return domainMatches.map((match) => this.mapMatch(match));
  }

  mapLeagueGroup(
    leagueName: string,
    flag: string,
    matches: Match[],
  ): FrontendLeagueGroup {
    return {
      league: leagueName,
      flag: flag,
      matches: this.mapMatches(matches),
    };
  }

  mapLeagueGroups(domainMatches: Match[]): FrontendLeagueGroup[] {
    const groupedMap = new Map<string, { flag: string; matches: Match[] }>();

    for (const match of domainMatches) {
      const leagueKey = match.league || '__no_league';
      if (!groupedMap.has(leagueKey)) {
        groupedMap.set(leagueKey, {
          flag: match.flag || '',
          matches: [],
        });
      }
      groupedMap.get(leagueKey)!.matches.push(match);
    }

    const result: FrontendLeagueGroup[] = [];

    // Önce ligi olmayanları ekle
    if (groupedMap.has('__no_league')) {
      const noLeague = groupedMap.get('__no_league')!;
      result.push({
        league: '',
        flag: '',
        matches: this.mapMatches(noLeague.matches),
      });
      groupedMap.delete('__no_league');
    }

    // Sonra diğer ligleri ekle
    for (const [league, data] of groupedMap.entries()) {
      result.push({
        league: league,
        flag: data.flag,
        matches: this.mapMatches(data.matches),
      });
    }

    return result;
  }

  // Canlı güncelleme için sadece değişen alanları içeren partial match
  mapLiveUpdate(updatedMatch: Match): Partial<FrontendMatch> {
    const update: Partial<FrontendMatch> = {
      id: updatedMatch.id,
      isLive: updatedMatch.isLive,
    };

    if (updatedMatch.minute !== undefined) {
      update.minute = updatedMatch.minute;
    }

    if (updatedMatch.score) {
      update.score = updatedMatch.score;
    }

    if (updatedMatch.stats) {
      update.stats = this.mapMatchStats(updatedMatch.stats);
    }

    return update;
  }

  mapLiveUpdates(updatedMatches: Match[]): Partial<FrontendMatch>[] {
    return updatedMatches.map((match) => this.mapLiveUpdate(match));
  }
}
