import { z } from 'zod';

export const OddsSchema = z.object({
  home: z.number().positive().or(z.string()),
  draw: z.number().positive().or(z.string()),
  away: z.number().positive().or(z.string()),
});

export type OddsType = z.infer<typeof OddsSchema>;

export class Odds {
  constructor(
    public readonly home: number | string,
    public readonly draw: number | string,
    public readonly away: number | string,
  ) {}

  static create(data: OddsType): Odds {
    return new Odds(data.home, data.draw, data.away);
  }

  toJSON(): OddsType {
    return {
      home: this.home,
      draw: this.draw,
      away: this.away,
    };
  }
}
