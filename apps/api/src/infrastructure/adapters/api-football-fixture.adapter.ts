import { Injectable } from '@nestjs/common';
import { IFixtureDataProvider } from '../../domain/ports/fixture-data-provider.port';
import { Match } from '../../domain/entities/match.entity';
import { ApiFootballClient } from '../clients/api-football.client';
import { ApiFootballToDomainMapper } from '../mappers/api-football-to-domain.mapper';
import { FileMatchRepository } from '../repositories/file-match.repository';

@Injectable()
export class ApiFootballFixtureAdapter implements IFixtureDataProvider {
  constructor(
    private readonly apiClient: ApiFootballClient,
    private readonly mapper: ApiFootballToDomainMapper,
    private readonly fileRepo: FileMatchRepository,
  ) {}

  async refreshAndSaveFixtures(): Promise<Match[]> {
    console.log('📅 Haftalık fikstür çekiliyor...');
    await this.fileRepo.clear();

    const allMatches: Match[] = [];
    const today = new Date();
    const now = new Date();

    const dates = Array.from({ length: 7 }, (_, i) => {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      return targetDate.toISOString().split('T')[0];
    });

    for (const date of dates) {
      const response = await this.apiClient.getFixtures({ date });
      const matches = this.mapper.mapFixturesToMatches(response);

      // Sadece gelecek veya canlı maçları filtrele
      const validMatches = matches.filter((match) => {
        const matchDateTime = new Date(`${match.date}T${match.time}:00`);
        const matchEndTime = new Date(matchDateTime.getTime() + 90 * 60 * 1000);
        return (
          matchDateTime >= now || (matchDateTime <= now && now <= matchEndTime)
        );
      });

      for (const match of validMatches) {
        await this.fileRepo.save(match);
      }

      allMatches.push(...validMatches);
      console.log(`  ✅ ${date}: ${validMatches.length} maç kaydedildi`);
    }

    console.log(`📊 Toplam ${allMatches.length} maç kaydedildi`);
    return allMatches;
  }

  async getWeeklyFixtures(): Promise<Match[]> {
    return this.refreshAndSaveFixtures();
  }

  async getMatchesByDate(date: string): Promise<Match[]> {
    const cached = await this.fileRepo.findByDate(date);
    if (cached.length > 0) {
      console.log(`📦 ${date} için cache'den ${cached.length} maç`);
      return cached;
    }

    const response = await this.apiClient.getFixtures({ date });
    const matches = this.mapper.mapFixturesToMatches(response);

    for (const match of matches) {
      await this.fileRepo.save(match);
    }

    return matches;
  }

  async getGroupedMatches(date?: string): Promise<Match[]> {
    if (date) return this.getMatchesByDate(date);
    return this.getWeeklyFixtures();
  }
}
