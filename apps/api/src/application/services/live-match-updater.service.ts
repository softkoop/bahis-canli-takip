import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FileMatchRepository } from '../../infrastructure/repositories/file-match.repository';
import { LiveUpdateGateway } from '../gateways/live-update.gateway';
import { ApiFootballClient } from '../../infrastructure/clients/api-football.client';
import { ApiFootballToDomainMapper } from '../../infrastructure/mappers/api-football-to-domain.mapper';
import { Match } from '../../domain/entities/match.entity';

@Injectable()
export class LiveMatchUpdaterService {
  constructor(
    private readonly apiClient: ApiFootballClient,
    private readonly matchRepository: FileMatchRepository,
    private readonly liveGateway: LiveUpdateGateway,
    private readonly mapper: ApiFootballToDomainMapper,
  ) {}

  // Her 30 saniyede bir bugünün tüm maçlarını güncelle
  @Cron('*/30 * * * * *')
  async updateTodayMatches() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`🔄 Bugünün (${today}) maçları güncelleniyor...`);

    // 1. API'den bugünün tüm maçlarını çek
    const response = await this.apiClient.getFixtures({ date: today });

    // 🔴 API Response'unu detaylı logla
    console.log(
      `📡 API Response Status: results=${response.results}, errors=${JSON.stringify(response.errors)}`,
    );

    const apiMatches = response.response || [];
    console.log(`📡 API'den ${apiMatches.length} maç geldi`);

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const apiMatch of apiMatches) {
      const fixtureId = apiMatch.fixture.id;
      const isLive =
        apiMatch.fixture.status.short === '1H' ||
        apiMatch.fixture.status.short === '2H';
      const minute = isLive
        ? (apiMatch.fixture.status.elapsed ?? 0)
        : undefined;

      const existingMatch = await this.matchRepository.findById(fixtureId);

      if (!existingMatch) {
        notFoundCount++;
        continue;
      }

      const updatedMatch = new Match(
        fixtureId,
        existingMatch.time,
        today,
        existingMatch.homeTeam,
        existingMatch.awayTeam,
        existingMatch.odds,
        existingMatch.confidence,
        existingMatch.betType,
        existingMatch.betOdd,
        isLive,
        existingMatch.league,
        existingMatch.flag,
        { home: apiMatch.goals.home ?? 0, away: apiMatch.goals.away ?? 0 },
        minute,
        existingMatch.stats,
      );

      await this.matchRepository.update(updatedMatch);
      this.liveGateway.sendMatchSpecificUpdate(fixtureId, updatedMatch);
      updatedCount++;
    }

    console.log(
      `✅ Güncelleme tamamlandı: ${updatedCount} güncellendi, ${notFoundCount} bulunamadı, toplam API maçı: ${apiMatches.length}`,
    );
  }
}
