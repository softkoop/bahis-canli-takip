import { z } from 'zod';

// Zod Schema
export const TeamNameSchema = z
  .object({
    fullName: z.string().min(1, 'Team name cannot be empty'),
    shortName: z.string().optional(),
    logo: z.string().optional(),
  })
  .transform((data): TeamName => {
    const shortName =
      data.shortName ||
      (data.fullName.length > 15
        ? data.fullName.substring(0, 12) + '...'
        : data.fullName);

    const logo = data.logo || data.fullName.substring(0, 3).toUpperCase();

    return new TeamName(data.fullName, shortName, logo);
  });

// Type
export type TeamNameType = z.infer<typeof TeamNameSchema>;
export type TeamNameInput = z.input<typeof TeamNameSchema>;
export type TeamNameOutput = z.output<typeof TeamNameSchema>;

// Class (Domain Entity)
export class TeamName {
  constructor(
    public readonly fullName: string,
    public readonly shortName: string,
    public readonly logo: string,
  ) {}

  static create(fullName: string, shortName?: string, logo?: string): TeamName {
    return TeamNameSchema.parse({ fullName, shortName, logo });
  }

  static fromJSON(data: any): TeamName {
    return TeamNameSchema.parse(data);
  }

  toJSON(): { fullName: string; shortName: string; logo: string } {
    return {
      fullName: this.fullName,
      shortName: this.shortName,
      logo: this.logo,
    };
  }
}
