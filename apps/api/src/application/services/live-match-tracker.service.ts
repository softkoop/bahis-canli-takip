/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ILiveDataProvider } from '../../domain/ports/live-data-provider.port';
import { IMatchRepository } from '../../domain/ports/match-repository.port';
import { AppLogger } from '../../shared/logger/app-logger.service';
import { MatchEvents } from '../events/match.events';
import { Match } from '../../domain/entities/match.entity';
import { MatchStats } from 'src/domain/value-objects/match-stats.value-objects';

interface LiveMatchData {
  matchId: number;
  minute: number;
  score: { home: number; away: number };
  isLive: boolean;
  stats?: any; // Takip edilen maçlar için stats
}

@Injectable()
export class LiveMatchTrackerService {
  private trackedMatches = new Set<number>();
  private cronJobRunning = true;

  constructor(
    private readonly liveProvider: ILiveDataProvider,
    private readonly matchRepository: IMatchRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('LiveMatchTrackerService');
  }

  updateTrackingList(matchIds: number[]) {
    this.logger.log(`🔄 Takip listesi güncelleniyor: ${matchIds.join(', ')}`);
    this.trackedMatches.clear();
    matchIds.forEach((id) => this.trackedMatches.add(id));
  }

  @Cron('*/30 * * * * *')
  async processLiveMatches() {
    if (!this.cronJobRunning) return;

    // ============ 1. Önceki canlı maçları al ============
    const previousLiveMatches = await this.matchRepository.findLiveMatches();
    const previousLiveIds = new Set(previousLiveMatches.map((m) => m.id));

    // ============ 2. TÜM canlı maçları al ============
    const liveMatches = await this.liveProvider.getCurrentLiveMatches();
    const currentLiveIds = new Set(liveMatches.map((m) => m.id));

    // ============ 3. Canlılığını kaybeden maçları bul ============
    const endedMatchIds = Array.from(previousLiveIds).filter(
      (id) => !currentLiveIds.has(id),
    );

    // ============ 4. Takip edilen maçların istatistiklerini al ============
    const trackedMatchIds = Array.from(this.trackedMatches);
    const statsMap = new Map<number, MatchStats>();

    if (trackedMatchIds.length > 0) {
      const statsResults = await Promise.allSettled(
        trackedMatchIds.map(async (matchId) => {
          const stats = await this.liveProvider.getMatchStats(matchId);
          return { matchId, stats: stats?.stats };
        }),
      );

      for (const result of statsResults) {
        if (result.status === 'fulfilled' && result.value.stats) {
          statsMap.set(result.value.matchId, result.value.stats);
        }
      }
    }

    // ============ 5. Tüm güncellemeleri hazırla ============
    const updates: Match[] = [];
    const combinedEvents: LiveMatchData[] = [];

    // 5a. Canlı maçları güncelle
    for (const liveMatch of liveMatches) {
      const existingMatch = await this.matchRepository.findById(liveMatch.id);
      if (!existingMatch) continue;

      const newStats = statsMap.get(liveMatch.id) || existingMatch.stats;

      const updatedMatch = new Match(
        liveMatch.id,
        liveMatch.time,
        liveMatch.date,
        liveMatch.homeTeam,
        liveMatch.awayTeam,
        liveMatch.odds,
        liveMatch.confidence,
        liveMatch.betType,
        liveMatch.betOdd,
        true,
        liveMatch.league,
        liveMatch.flag,
        liveMatch.score,
        liveMatch.minute,
        newStats,
      );

      updates.push(updatedMatch);
      combinedEvents.push({
        matchId: liveMatch.id,
        minute: liveMatch.minute as number,
        score: liveMatch.score as { home: number; away: number },
        isLive: true,
        stats: newStats,
      });
    }

    // 5b. Biten maçları güncelle (SADECE isLive false yap, diğer alanlar aynı kalsın)
    for (const matchId of endedMatchIds) {
      const existingMatch = await this.matchRepository.findById(matchId);
      if (!existingMatch) continue;

      const updatedMatch = new Match(
        existingMatch.id,
        existingMatch.time,
        existingMatch.date,
        existingMatch.homeTeam,
        existingMatch.awayTeam,
        existingMatch.odds,
        existingMatch.confidence,
        existingMatch.betType,
        existingMatch.betOdd,
        false, // ← SADECE BURASI DEĞİŞTİ
        existingMatch.league,
        existingMatch.flag,
        existingMatch.score,
        existingMatch.minute,
        existingMatch.stats,
      );

      updates.push(updatedMatch);

      // Frontend'e bildir (opsiyonel)
      this.eventEmitter.emit(MatchEvents.MATCH_REMOVED, { matchId });
    }

    // ============ 6. TOPLU dosyaya yaz ============
    await this.batchUpdateMatches(updates);

    const hasChanges =
      endedMatchIds.length > 0 ||
      liveMatches.length !== previousLiveMatches.length;

    // ============ 7. Event fırlat ============
    if (combinedEvents.length > 0) {
      this.eventEmitter.emit(MatchEvents.ALL_MATCHES_UPDATED, {
        matches: combinedEvents,
        needsRefresh: hasChanges,
        timestamp: new Date().toISOString(),
      });
    }

    this.logger.log(
      `📤 ${combinedEvents.length} canlı maç gönderildi, ${endedMatchIds.length} maç kapatıldı, refresh: ${hasChanges}`,
    );
  }

  private async batchUpdateMatches(updates: Match[]) {
    if (updates.length === 0) return;

    const results = await Promise.allSettled(
      updates.map((match) => this.matchRepository.upsert(match)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (failed > 0) {
      this.logger.warn(`⚠️ ${failed}/${updates.length} maç güncellenemedi`);
    }

    this.logger.log(`📦 ${succeeded} maç upsert edildi`);
  }

  getTrackedMatches(): number[] {
    return Array.from(this.trackedMatches);
  }

  async onModuleDestroy() {
    this.logger.log('LiveMatchTrackerService kapatılıyor...');
    this.cronJobRunning = false;
  }
}
