import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Filter DTO
export const MatchFilterSchema = z.object({
  date: z.string().optional(),
  league: z.string().optional(),
  isLive: z.boolean().optional(),
  searchText: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export class MatchFilterDto extends createZodDto(MatchFilterSchema) {}

// Date List Response DTO
export const DateListResponseSchema = z.object({
  date: z.string(),
  dayName: z.string(),
  dayNumber: z.number(),
});

export class DateListResponseDto extends createZodDto(DateListResponseSchema) {}

// Live Match Update DTO (Socket için)
export const LiveMatchUpdateSchema = z.object({
  id: z.number(),
  isLive: z.boolean(),
  minute: z.number().optional(),
  score: z
    .object({
      home: z.number(),
      away: z.number(),
    })
    .optional(),
  stats: z
    .object({
      home: z.object({
        possession: z.number(),
        shots: z.number(),
        accurateShots: z.number(),
        dangerousAttacks: z.number(),
        corners: z.number(),
      }),
      away: z.object({
        possession: z.number(),
        shots: z.number(),
        accurateShots: z.number(),
        dangerousAttacks: z.number(),
        corners: z.number(),
      }),
      matchDuration: z.number(),
      currentHalf: z.enum(['first', 'second']),
    })
    .optional(),
});

export class LiveMatchUpdateDto extends createZodDto(LiveMatchUpdateSchema) {}
