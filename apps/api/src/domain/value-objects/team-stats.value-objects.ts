import { z } from 'zod';

export const TeamStatsSchema = z.object({
  possession: z.number().min(0).max(100),
  shots: z.number().min(0).max(50),
  accurateShots: z.number().min(0).max(30),
  dangerousAttacks: z.number().min(0).max(100),
  corners: z.number().min(0).max(30),
});

export type TeamStatsType = z.infer<typeof TeamStatsSchema>;

export class TeamStats {
  constructor(
    public readonly possession: number,
    public readonly shots: number,
    public readonly accurateShots: number,
    public readonly dangerousAttacks: number,
    public readonly corners: number,
  ) {}

  static create(data: TeamStatsType): TeamStats {
    return new TeamStats(
      data.possession,
      data.shots,
      data.accurateShots,
      data.dangerousAttacks,
      data.corners,
    );
  }

  static empty(): TeamStats {
    return new TeamStats(0, 0, 0, 0, 0);
  }

  update(changes: Partial<TeamStatsType>): TeamStats {
    return new TeamStats(
      changes.possession ?? this.possession,
      changes.shots ?? this.shots,
      changes.accurateShots ?? this.accurateShots,
      changes.dangerousAttacks ?? this.dangerousAttacks,
      changes.corners ?? this.corners,
    );
  }

  toJSON(): TeamStatsType {
    return {
      possession: this.possession,
      shots: this.shots,
      accurateShots: this.accurateShots,
      dangerousAttacks: this.dangerousAttacks,
      corners: this.corners,
    };
  }
}
