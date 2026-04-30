import { Match } from '../entities/match.entity';
import { IMatchRepository } from '../ports/match-repository.port';
import { IFixtureDataProvider } from '../ports/fixture-data-provider.port';
import { ILiveDataProvider } from '../ports/live-data-provider.port';

export class MatchDomainService {
  constructor(
    private readonly matchRepository: IMatchRepository,
    private readonly fixtureProvider: IFixtureDataProvider,
    private readonly liveProvider: ILiveDataProvider,
  ) {}

  async getWeeklyFixtures(): Promise<Match[]> {
    // Cache'e bak - eğer boşsa veya eskiyse yenile
    const cached = await this.matchRepository.findAll();
    const now = new Date();

    // Cache'deki maçların hepsi gelecekte mi kontrol et
    const hasFutureMatches = cached.some((match) => {
      const matchDateTime = new Date(`${match.date}T${match.time}:00`);
      return matchDateTime >= now;
    });

    if (cached.length > 0 && hasFutureMatches) {
      console.log(`📦 Cache'den ${cached.length} maç yüklendi`);
      return cached;
    }

    console.log("🔄 Cache boş veya eski, API'den çekiliyor...");
    const fixtures = await this.fixtureProvider.getWeeklyFixtures();

    // Cache'i temizle ve yeniden doldur
    const allMatches = await this.matchRepository.findAll();
    for (const match of allMatches) {
      await this.matchRepository.delete(match.id);
    }

    for (const match of fixtures) {
      await this.matchRepository.save(match);
    }

    return fixtures;
  }

  async getMatchesByDate(date: string): Promise<Match[]> {
    // 1. Önce cache'den kontrol et
    console.log(`🔍 getMatchesByDate çağrıldı: ${date}`);
    const cached = await this.matchRepository.findByDate(date);
    const now = new Date();

    const futureCachedMatches = cached.filter((match) => {
      const matchDateTime = new Date(`${match.date}T${match.time}:00`);
      return matchDateTime >= now;
    });

    if (futureCachedMatches.length > 0) {
      console.log(
        `📦 ${date} için cache'den ${futureCachedMatches.length} maç yüklendi`,
      );
      return futureCachedMatches;
    }

    // 2. Cache'de yoksa API'den çek
    console.log(`🔄 ${date} cache'de yok, API'den çekiliyor...`);
    const apiMatches = await this.fixtureProvider.getMatchesByDate(date);

    // 3. Sadece gelecek maçları filtrele
    const futureMatches = apiMatches.filter((match) => {
      const matchDateTime = new Date(`${match.date}T${match.time}:00`);
      return matchDateTime >= now;
    });

    // 4. 🔴 CACHE'E KAYDET (Bu önemli!)
    for (const match of futureMatches) {
      await this.matchRepository.save(match);
    }

    console.log(
      `✅ ${date} için ${futureMatches.length} maç API'den çekildi ve cache'e kaydedildi`,
    );
    return futureMatches;
  }

  async getLiveMatches(): Promise<Match[]> {
    const liveMatches = await this.matchRepository.findLiveMatches();
    if (liveMatches.length > 0) {
      return liveMatches;
    }

    return await this.liveProvider.getCurrentLiveMatches();
  }

  async getMatchStats(matchId: number): Promise<Match | null> {
    const match = await this.matchRepository.findById(matchId);
    if (match && match.isLive) {
      return await this.liveProvider.getMatchStats(matchId);
    }
    return match;
  }
}
