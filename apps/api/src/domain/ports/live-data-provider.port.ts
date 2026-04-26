import { Observable } from 'rxjs';
import { Match } from '../entities/match.entity';

export interface ILiveDataProvider {
  /**
   * Canlı maç verilerini stream olarak sağlar
   * @returns Observable her 5 saniyede güncellenen Match objeleri
   */
  getLiveMatchUpdates(): Observable<Match[]>;

  /**
   * Belirli bir maçın anlık istatistiklerini getirir
   * @param matchId Maç ID'si
   */
  getMatchStats(matchId: number): Promise<Match | null>;

  /**
   * Tüm canlı maçları getirir
   */
  getCurrentLiveMatches(): Promise<Match[]>;
}
