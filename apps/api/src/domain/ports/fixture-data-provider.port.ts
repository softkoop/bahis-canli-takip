// src/domain/ports/fixture-data-provider.port.ts
import { Match } from '../entities/match.entity';

export abstract class IFixtureDataProvider {
  /**
   * Haftalık fikstürü getirir
   */
  abstract getWeeklyFixtures(): Promise<Match[]>;

  /**
   * Belirli bir tarihteki maçları getirir
   * @param date ISO tarih formatında (YYYY-MM-DD)
   */
  abstract getMatchesByDate(date: string): Promise<Match[]>;

  /**
   * Lig bazında gruplanmış maçları getirir
   * @param date İsteğe bağlı tarih filtresi
   */
  abstract getGroupedMatches(date?: string): Promise<Match[]>;
}
