import { z } from 'zod';
import { Match, MatchSchema } from './match.entity';

export const LeagueGroupSchema = z.object({
  league: z.string(),
  flag: z.string(),
  matches: z.array(MatchSchema),
});

export type LeagueGroupType = z.infer<typeof LeagueGroupSchema>;

export class LeagueGroup {
  constructor(
    public readonly league: string,
    public readonly flag: string,
    public readonly matches: Match[],
  ) {}

  static create(data: LeagueGroupType): LeagueGroup {
    return new LeagueGroup(
      data.league,
      data.flag,
      data.matches.map((m) => Match.create(m)),
    );
  }

  toJSON(): LeagueGroupType {
    return {
      league: this.league,
      flag: this.flag,
      matches: this.matches.map((m) => m.toJSON()),
    };
  }
}
