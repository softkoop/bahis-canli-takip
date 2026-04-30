import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ApiFootballFixtureAdapter } from '../adapters/api-football-fixture.adapter';

@Injectable()
export class FixtureSchedulerService {
  constructor(private readonly fixtureProvider: ApiFootballFixtureAdapter) {}

  // Her gün saat 12:00'de çalışır
  @Cron('0 3 * * *')
  async refreshWeeklyFixtures() {
    console.log('🔄 Günlük fikstür güncelleme başladı...');
    try {
      // Adapter içinde hem temizlik hem kayıt yapıyor
      const fixtures = await this.fixtureProvider.getWeeklyFixtures();
      console.log(`✅ ${fixtures.length} gelecek maç başarıyla güncellendi.`);
    } catch (error) {
      console.error('Fikstür güncellenirken hata oluştu:', error);
    }
  }
}
