import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MatchDomainService } from '../domain/services/match.service';
import { InMemoryMatchRepository } from './repositories/in-memory-match.repository';
import { FileMatchRepository } from './repositories/file-match.repository';
import { MockStatsGenerator } from './generators/mock-stats-generator.service';
import { DomainToFrontendMapper } from './mappers/domain-to-frontend.mapper';
import { ApiResponseMapper } from './mappers/api-response.mapper';
import { FixtureSchedulerService } from './schedulers/fixture-scheduler.service';
import {
  MATCH_REPOSITORY_TOKEN,
  FIXTURE_PROVIDER_TOKEN,
  LIVE_PROVIDER_TOKEN,
} from '../domain/ports/tokens';
import { ApiFootballFixtureAdapter } from './adapters/api-football-fixture.adapter';
import { ApiFootballLiveAdapter } from './adapters/api-football-live.adapter';
import { ApiFootballToDomainMapper } from './mappers/api-football-to-domain.mapper';
import { ApiFootballClient } from './clients/api-football.client';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    MockStatsGenerator,
    InMemoryMatchRepository,
    FileMatchRepository,
    DomainToFrontendMapper,
    ApiResponseMapper,
    ApiFootballClient,
    FixtureSchedulerService,
    ApiFootballToDomainMapper,
    ApiFootballFixtureAdapter,

    // Repository
    {
      provide: MATCH_REPOSITORY_TOKEN,
      useClass: FileMatchRepository,
    },
    // FIXTURE PROVIDER - GERÇEK API'YE GEÇİŞ!
    {
      provide: FIXTURE_PROVIDER_TOKEN,
      useClass: ApiFootballFixtureAdapter, // ← Mock'tan FreeApi'ye geçiş
    },
    // LIVE PROVIDER (şimdilik mock, sonra değişecek)
    {
      provide: LIVE_PROVIDER_TOKEN,
      useClass: ApiFootballLiveAdapter,
    },
    MatchDomainService,
  ],
  exports: [
    MATCH_REPOSITORY_TOKEN,
    FIXTURE_PROVIDER_TOKEN,
    LIVE_PROVIDER_TOKEN,
    MatchDomainService,
    DomainToFrontendMapper,
    ApiResponseMapper,
    ApiFootballToDomainMapper,
    ApiFootballClient,
    MockStatsGenerator,
    FileMatchRepository, // ← EKLENDI
    ApiFootballFixtureAdapter,
  ],
})
export class InfrastructureModule {}
