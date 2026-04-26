/* eslint-disable @typescript-eslint/require-await */
import { Inject, Injectable } from '@nestjs/common';
import { IFixtureDataProvider } from '../../domain/ports/fixture-data-provider.port';
import { Match } from '../../domain/entities/match.entity';

import { MockStatsGenerator } from '../generators/mock-stats-generator.service';
import { MATCH_REPOSITORY_TOKEN } from 'src/domain/ports/tokens';
import type { IMatchRepository } from 'src/domain/ports/match-repository.port';

@Injectable()
export class MockFixtureDataAdapter implements IFixtureDataProvider {
  private readonly leagues = [
    {
      name: 'İspanya - La Liga',
      flag: '🇪🇸',
      teams: [
        'Real Madrid',
        'Barcelona',
        'Atletico Madrid',
        'Rayo Vallecano',
        'Levante',
        'Sevilla',
      ],
    },
    {
      name: 'İtalya - Serie A',
      flag: '🇮🇹',
      teams: [
        'Juventus',
        'AC Milan',
        'Inter Milan',
        'Roma',
        'Cremonese',
        'Fiorentina',
      ],
    },
    {
      name: 'İngiltere - Premier League',
      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      teams: [
        'Manchester City',
        'Liverpool',
        'Chelsea',
        'Arsenal',
        'Manchester United',
        'Tottenham',
      ],
    },
    {
      name: 'Türkiye - Süper Lig',
      flag: '🇹🇷',
      teams: [
        'Galatasaray',
        'Fenerbahçe',
        'Beşiktaş',
        'Trabzonspor',
        'Başakşehir',
        'Adana Demirspor',
      ],
    },
    {
      name: 'Almanya - Bundesliga',
      flag: '🇩🇪',
      teams: [
        'Bayern Munich',
        'Borussia Dortmund',
        'RB Leipzig',
        'Bayer Leverkusen',
        'Eintracht Frankfurt',
        'Wolfsburg',
      ],
    },
    {
      name: 'Fransa - Ligue 1',
      flag: '🇫🇷',
      teams: ['PSG', 'Marseille', 'Lyon', 'Monaco', 'Lille', 'Nice'],
    },
  ];

  constructor(
    private readonly statsGenerator: MockStatsGenerator,
    @Inject(MATCH_REPOSITORY_TOKEN)
    private readonly matchRepository: IMatchRepository,
  ) {}

  async onModuleInit() {
    console.log('🏁 MockFixtureDataAdapter initializing...');

    // Önce repository'yi temizle
    await this.matchRepository.clear();

    // Haftalık fikstürü üret
    const fixtures = await this.getWeeklyFixtures();

    for (const match of fixtures) {
      await this.matchRepository.save(match);
      if (match.isLive) {
        console.log(
          `🔴 SAVED LIVE: ${match.homeTeam.fullName} vs ${match.awayTeam.fullName} (${match.minute}')`,
        );
      }
    }

    // Doğrulama
    const allMatches = await this.matchRepository.findAll();
    const liveMatches = allMatches.filter((m) => m.isLive);
    console.log(
      `🔍 VERIFICATION: Repository has ${allMatches.length} matches, ${liveMatches.length} live`,
    );
  }

  private random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomOdds() {
    return {
      home: (Math.random() * 3 + 1.5).toFixed(2),
      draw: (Math.random() * 2 + 2.5).toFixed(2),
      away: (Math.random() * 3 + 1.5).toFixed(2),
    };
  }

  private getWeekDates(): Date[] {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private calculateMatchLiveStatus(
    matchDate: Date,
    matchTime: string,
  ): { isLive: boolean; currentMinute: number } {
    const now = new Date();
    const [hour, minute] = matchTime.split(':').map(Number);
    const matchDateTime = new Date(matchDate);
    matchDateTime.setHours(hour, minute, 0, 0);

    const matchEndTime = new Date(matchDateTime);
    matchEndTime.setHours(
      matchDateTime.getHours() + 1,
      matchDateTime.getMinutes() + 45,
      0,
      0,
    );

    if (now < matchDateTime) {
      return { isLive: false, currentMinute: 0 };
    }

    if (now >= matchDateTime && now <= matchEndTime) {
      const elapsedMinutes = Math.floor(
        (now.getTime() - matchDateTime.getTime()) / (1000 * 60),
      );
      const currentMinute = Math.min(90, Math.max(0, elapsedMinutes));
      return { isLive: true, currentMinute };
    }

    return { isLive: false, currentMinute: 90 };
  }

  async getWeeklyFixtures(): Promise<Match[]> {
    const weekDates = this.getWeekDates();
    let allMatches: Match[] = [];
    let nextId = 1;

    for (const date of weekDates) {
      const dayMatches = await this.generateMatchesForDate(date, nextId);
      allMatches = [...allMatches, ...dayMatches];
      nextId += dayMatches.length + 100;
    }

    return allMatches;
  }

  async getMatchesByDate(date: string): Promise<Match[]> {
    const targetDate = new Date(date);
    return await this.generateMatchesForDate(targetDate, 1);
  }

  async getGroupedMatches(date?: string): Promise<Match[]> {
    if (date) {
      return await this.getMatchesByDate(date);
    }
    return await this.getWeeklyFixtures();
  }

  private async generateMatchesForDate(
    date: Date,
    baseId: number,
  ): Promise<Match[]> {
    const matches: Match[] = [];
    const dateStr = this.formatDate(date);
    const isToday = this.formatDate(new Date()) === dateStr;
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const matchCount = isWeekend ? this.random(15, 25) : this.random(8, 15);

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // ============ NORMAL MAÇLARI OLUŞTUR ============
    for (let i = 0; i < matchCount; i++) {
      const league =
        this.leagues[Math.floor(Math.random() * this.leagues.length)];
      const teams = [...league.teams];
      const homeTeamName = teams[Math.floor(Math.random() * teams.length)];
      const awayTeamName = teams[Math.floor(Math.random() * teams.length)];

      if (homeTeamName === awayTeamName) continue;

      // Maç saati belirleme
      let hour: number;
      if (isToday) {
        const minHour = Math.min(Math.max(currentHour + 1, 14), 22);
        hour = this.random(minHour, 23);
      } else {
        hour = this.random(18, 23);
      }
      const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      const { isLive, currentMinute: liveMinute } =
        this.calculateMatchLiveStatus(date, timeStr);
      const odds = this.randomOdds();

      let matchStats = undefined;
      let matchScore = undefined;
      let matchMinute = undefined;

      if (isLive && liveMinute > 0) {
        matchStats = this.statsGenerator.generateMatchStatsAtMinute(liveMinute);
        matchScore = this.statsGenerator.generateScoreAtMinute(liveMinute);
        matchMinute = liveMinute;
      } else if (isLive && liveMinute === 0) {
        matchStats = this.statsGenerator.generateInitialMatchStats();
        matchScore = { home: 0, away: 0 };
        matchMinute = 0;
      }

      const match = Match.create({
        id: baseId + i,
        time: timeStr,
        date: dateStr,
        homeTeam: {
          fullName: homeTeamName,
          shortName:
            homeTeamName.length > 15
              ? homeTeamName.substring(0, 12) + '...'
              : homeTeamName,
          logo: homeTeamName.substring(0, 3).toUpperCase(),
        },
        awayTeam: {
          fullName: awayTeamName,
          shortName:
            awayTeamName.length > 15
              ? awayTeamName.substring(0, 12) + '...'
              : awayTeamName,
          logo: awayTeamName.substring(0, 3).toUpperCase(),
        },
        odds: {
          home: parseFloat(odds.home),
          draw: parseFloat(odds.draw),
          away: parseFloat(odds.away),
        },
        confidence: `${this.random(55, 92)}%`,
        betType: ['1', 'X', '2', '1X', 'X2', '12', '-1.5', '+2.5'][
          Math.floor(Math.random() * 8)
        ],
        betOdd: parseFloat(odds.home),
        isLive: isLive,
        league: league.name,
        flag: league.flag,
        score: matchScore,
        minute: matchMinute,
        stats: matchStats,
      });

      matches.push(match);
    }

    // ============ ZORLA CANLI MAÇ EKLE (HER ZAMAN) ============
    if (isToday) {
      // Şu anki saatte başlayan bir maç oluştur
      const liveHour = currentHour;
      const liveMinute = currentMinute;
      const timeStr = `${liveHour.toString().padStart(2, '0')}:${liveMinute.toString().padStart(2, '0')}`;

      // Rastgele bir lig seç
      const league =
        this.leagues[Math.floor(Math.random() * this.leagues.length)];
      const teams = [...league.teams];
      const homeTeamName = teams[0];
      const awayTeamName = teams[1];

      // 0. dakikadan başlayan canlı maç
      const initialStats = this.statsGenerator.generateInitialMatchStats();

      const liveMatch = Match.create({
        id: baseId + 999999,
        time: timeStr,
        date: dateStr,
        homeTeam: {
          fullName: `🔴 ${homeTeamName}`,
          shortName:
            homeTeamName.length > 15
              ? homeTeamName.substring(0, 12) + '...'
              : homeTeamName,
          logo: homeTeamName.substring(0, 3).toUpperCase(),
        },
        awayTeam: {
          fullName: awayTeamName,
          shortName:
            awayTeamName.length > 15
              ? awayTeamName.substring(0, 12) + '...'
              : awayTeamName,
          logo: awayTeamName.substring(0, 3).toUpperCase(),
        },
        odds: {
          home: 2.5,
          draw: 3.2,
          away: 2.8,
        },
        confidence: '75%',
        betType: '1',
        betOdd: 2.5,
        isLive: true,
        league: `🔴 CANLI MAÇ - ${league.name}`,
        flag: league.flag,
        score: { home: 0, away: 0 },
        minute: 0,
        stats: initialStats,
      });

      // Var olan bir maçla ID çakışmasın diye kontrol et
      const exists = matches.some((m) => m.id === liveMatch.id);
      if (!exists) {
        matches.push(liveMatch);
        console.log(
          `🔴 FORCED LIVE MATCH: ${homeTeamName} vs ${awayTeamName} at ${timeStr}`,
        );
      }
    }

    // Canlı maç sayısını logla
    const liveCount = matches.filter((m) => m.isLive).length;
    if (liveCount > 0) {
      console.log(
        `📊 ${dateStr}: Total matches: ${matches.length}, Live matches: ${liveCount}`,
      );
    }

    return matches;
  }
}
