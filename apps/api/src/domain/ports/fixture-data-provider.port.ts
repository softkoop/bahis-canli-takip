import { Match } from '../entities/match.entity';

export interface IFixtureDataProvider {
  /**
   * Haftalık fikstürü getirir
   */
  getWeeklyFixtures(): Promise<Match[]>;

  /**
   * Belirli bir tarihteki maçları getirir
   * @param date ISO tarih formatında (YYYY-MM-DD)
   */
  getMatchesByDate(date: string): Promise<Match[]>;

  /**
   * Lig bazında gruplanmış maçları getirir
   * @param date İsteğe bağlı tarih filtresi
   */
  getGroupedMatches(date?: string): Promise<Match[]>;
}
