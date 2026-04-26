/* eslint-disable @typescript-eslint/require-await */
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FileMatchRepository } from '../../infrastructure/repositories/file-match.repository';
import { LiveUpdateGateway } from '../gateways/live-update.gateway';
import { ApiFootballClient } from '../../infrastructure/clients/api-football.client';
import { ApiFootballToDomainMapper } from '../../infrastructure/mappers/api-football-to-domain.mapper';

@Injectable()
export class LiveMatchTrackerService {
  private trackedMatches = new Set<number>(); // Sadece takip edilen ID'ler
  private cronJobRunning = true;
  constructor(
    private readonly apiClient: ApiFootballClient,
    private readonly matchRepository: FileMatchRepository,
    @Inject(forwardRef(() => LiveUpdateGateway))
    private readonly liveGateway: LiveUpdateGateway,
    private readonly mapper: ApiFootballToDomainMapper,
  ) {}

  updateTrackingList(matchIds: number[]) {
    console.log(`🔄 Takip listesi güncelleniyor: ${matchIds.join(', ')}`);
    this.trackedMatches.clear();
    matchIds.forEach((id) => this.trackedMatches.add(id));
  }

  // 🔴 NestJS Cron ile her 30 saniyede bir çalışır
  @Cron('*/30 * * * * *') // 30 saniye
  async processTrackedMatches() {
    if (!this.cronJobRunning) return;
    if (this.trackedMatches.size === 0) return;

    console.log(`🔄 ${this.trackedMatches.size} takip edilen maç işleniyor...`);

    for (const matchId of this.trackedMatches) {
      await this.processMatch(matchId);
    }
  }

  private async processMatch(matchId: number) {
    try {
      // 1. Dosyadan maçı kontrol et
      const match = await this.matchRepository.findById(matchId);

      // 2. Canlılığını kaybetti mi?
      if (!match || !match.isLive) {
        console.log(
          `🔴 Maç ${matchId} canlılığını kaybetti, takipten çıkarılıyor`,
        );
        this.trackedMatches.delete(matchId);
        this.liveGateway.sendMatchRemoved(matchId);
        return;
      }

      // 3. İstatistikleri API'den al
      const statsResponse = await this.apiClient.getFixtureStatistics(matchId);

      if (statsResponse.response && statsResponse.response.length >= 2) {
        // 🔴 Dakikayı dosyadan al (LiveMatchUpdaterService zaten güncelliyor)
        const currentMinute = match.minute ?? 0;

        const updatedMatch = this.mapper.updateMatchWithStats(
          match,
          statsResponse,
          currentMinute,
        );
        await this.matchRepository.update(updatedMatch);
        this.liveGateway.sendMatchSpecificUpdate(matchId, updatedMatch);
        console.log(
          `📊 Maç ${matchId} istatistikler güncellendi (${currentMinute}')`,
        );
      }
    } catch (error) {
      console.error(`Maç ${matchId} işlenirken hata:`, error);
    }
  }

  getTrackedMatches(): number[] {
    return Array.from(this.trackedMatches);
  }
  async onModuleDestroy() {
    console.log(
      '🛑 LiveMatchTrackerService kapatılıyor, cron job durduruluyor...',
    );
    this.cronJobRunning = false;
  }
}
