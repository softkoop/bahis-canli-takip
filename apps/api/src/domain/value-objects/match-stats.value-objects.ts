import { z } from 'zod';
import { TeamStats, TeamStatsSchema } from './team-stats.value-objects';

export const MatchHalfEnum = z.enum(['first', 'second']);
export type MatchHalf = z.infer<typeof MatchHalfEnum>;

export const MatchStatsSchema = z.object({
  home: TeamStatsSchema,
  away: TeamStatsSchema,
  matchDuration: z.number().min(0).max(90),
  currentHalf: MatchHalfEnum,
});

export type MatchStatsType = z.infer<typeof MatchStatsSchema>;

export class MatchStats {
  constructor(
    public readonly home: TeamStats,
    public readonly away: TeamStats,
    public readonly matchDuration: number,
    public readonly currentHalf: MatchHalf,
  ) {}

  static create(data: MatchStatsType): MatchStats {
    return new MatchStats(
      TeamStats.create(data.home),
      TeamStats.create(data.away),
      data.matchDuration,
      data.currentHalf,
    );
  }

  static initial(homePossession: number, awayPossession: number): MatchStats {
    return new MatchStats(
      TeamStats.create({
        possession: homePossession,
        shots: 0,
        accurateShots: 0,
        dangerousAttacks: 0,
        corners: 0,
      }),
      TeamStats.create({
        possession: awayPossession,
        shots: 0,
        accurateShots: 0,
        dangerousAttacks: 0,
        corners: 0,
      }),
      0,
      'first',
    );
  }

  update(updates: Partial<MatchStatsType>): MatchStats {
    return new MatchStats(
      updates.home ? TeamStats.create(updates.home) : this.home,
      updates.away ? TeamStats.create(updates.away) : this.away,
      updates.matchDuration ?? this.matchDuration,
      updates.currentHalf ?? this.currentHalf,
    );
  }

  toJSON(): MatchStatsType {
    return {
      home: this.home.toJSON(),
      away: this.away.toJSON(),
      matchDuration: this.matchDuration,
      currentHalf: this.currentHalf,
    };
  }
}
