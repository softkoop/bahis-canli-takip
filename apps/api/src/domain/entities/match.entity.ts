import { z } from 'zod';
import { TeamName } from '../value-objects/team-name.value-object';
import { Odds, OddsSchema } from '../value-objects/odds.value-object';
import {
  MatchStats,
  MatchStatsSchema,
} from '../value-objects/match-stats.value-objects';

// TeamName için plain schema (transform yok)
const TeamNamePlainSchema = z.object({
  fullName: z.string(),
  shortName: z.string(),
  logo: z.string(),
});

export const MatchSchema = z.object({
  id: z.number(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  date: z.string(), // ← z.date() yerine z.string() yap!
  homeTeam: TeamNamePlainSchema,
  awayTeam: TeamNamePlainSchema,
  odds: OddsSchema,
  confidence: z.string().nullable(),
  betType: z.string().nullable(),
  betOdd: z.number().nullable(),
  isLive: z.boolean(),
  league: z.string().nullable(),
  flag: z.string().nullable(),
  score: z
    .object({
      home: z.number(),
      away: z.number(),
    })
    .optional(),
  minute: z.number().min(0).max(90).optional(),
  stats: MatchStatsSchema.optional(),
});

export type MatchType = z.infer<typeof MatchSchema>;

export class Match {
  constructor(
    public readonly id: number,
    public readonly time: string,
    public readonly date: string, // ← tip olarak string
    public readonly homeTeam: TeamName,
    public readonly awayTeam: TeamName,
    public readonly odds: Odds,
    public readonly confidence: string | null,
    public readonly betType: string | null,
    public readonly betOdd: number | null,
    public readonly isLive: boolean,
    public readonly league: string | null,
    public readonly flag: string | null,
    public readonly score?: { home: number; away: number },
    public readonly minute?: number,
    public readonly stats?: MatchStats,
  ) {}

  static create(data: MatchType): Match {
    return new Match(
      data.id,
      data.time,
      data.date, // ← direk kullan, toISOString'e gerek yok
      TeamName.create(
        data.homeTeam.fullName,
        data.homeTeam.shortName,
        data.homeTeam.logo,
      ),
      TeamName.create(
        data.awayTeam.fullName,
        data.awayTeam.shortName,
        data.awayTeam.logo,
      ),
      Odds.create(data.odds),
      data.confidence,
      data.betType,
      data.betOdd,
      data.isLive,
      data.league,
      data.flag,
      data.score,
      data.minute,
      data.stats ? MatchStats.create(data.stats) : undefined,
    );
  }

  updateStats(newStats: MatchStats): Match {
    return new Match(
      this.id,
      this.time,
      this.date,
      this.homeTeam,
      this.awayTeam,
      this.odds,
      this.confidence,
      this.betType,
      this.betOdd,
      this.isLive,
      this.league,
      this.flag,
      this.score,
      newStats.matchDuration,
      newStats,
    );
  }

  updateScore(homeScore: number, awayScore: number): Match {
    return new Match(
      this.id,
      this.time,
      this.date,
      this.homeTeam,
      this.awayTeam,
      this.odds,
      this.confidence,
      this.betType,
      this.betOdd,
      this.isLive,
      this.league,
      this.flag,
      { home: homeScore, away: awayScore },
      this.minute,
      this.stats,
    );
  }

  toJSON(): MatchType {
    return {
      id: this.id,
      time: this.time,
      date: this.date, // ← direk string döndür
      homeTeam: {
        fullName: this.homeTeam.fullName,
        shortName: this.homeTeam.shortName,
        logo: this.homeTeam.logo,
      },
      awayTeam: {
        fullName: this.awayTeam.fullName,
        shortName: this.awayTeam.shortName,
        logo: this.awayTeam.logo,
      },
      odds: this.odds.toJSON(),
      confidence: this.confidence,
      betType: this.betType,
      betOdd: this.betOdd,
      isLive: this.isLive,
      league: this.league,
      flag: this.flag,
      score: this.score,
      minute: this.minute,
      stats: this.stats?.toJSON(),
    };
  }
}
