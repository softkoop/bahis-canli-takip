// src/domain/ports/live-data-provider.port.ts
import { Match } from '../entities/match.entity';

export abstract class ILiveDataProvider {
  /**
   * Belirli bir maçın anlık istatistiklerini getirir
   * @param matchId Maç ID'si
   */
  abstract getMatchStats(matchId: number): Promise<Match | null>;

  /**
   * Tüm canlı maçları getirir
   */
  abstract getCurrentLiveMatches(): Promise<Match[]>;
}
