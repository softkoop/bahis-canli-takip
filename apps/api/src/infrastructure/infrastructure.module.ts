import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MatchDomainService } from '../domain/services/match.service';
import { InMemoryMatchRepository } from './repositories/in-memory-match.repository';
import { FileMatchRepository } from './repositories/file-match.repository';
import { MockStatsGenerator } from './generators/mock-stats-generator.service';
import { DomainToFrontendMapper } from './mappers/domain-to-frontend.mapper';
import { ApiResponseMapper } from './mappers/api-response.mapper';
import { FixtureSchedulerService } from './schedulers/fixture-scheduler.service';
import { ApiFootballFixtureAdapter } from './adapters/api-football-fixture.adapter';
import { ApiFootballLiveAdapter } from './adapters/api-football-live.adapter';
import { ApiFootballToDomainMapper } from './mappers/api-football-to-domain.mapper';
import { ApiFootballClient } from './clients/api-football.client';
import { IFixtureDataProvider } from 'src/domain/ports/fixture-data-provider.port';
import { IMatchRepository } from 'src/domain/ports/match-repository.port';
import { ILiveDataProvider } from 'src/domain/ports/live-data-provider.port';
import { SqliteMatchRepository } from './repositories/sqlite-match.repoistory';

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
    {
      provide: IMatchRepository,
      useClass: SqliteMatchRepository,
    },
    {
      provide: IFixtureDataProvider,
      useClass: ApiFootballFixtureAdapter,
    },
    {
      provide: ILiveDataProvider,
      useClass: ApiFootballLiveAdapter,
    },
    {
      provide: MatchDomainService,
      useFactory: (
        matchRepo: IMatchRepository,
        fixtureProvider: IFixtureDataProvider,
        liveProvider: ILiveDataProvider,
      ) => {
        return new MatchDomainService(matchRepo, fixtureProvider, liveProvider);
      },
      inject: [IMatchRepository, IFixtureDataProvider, ILiveDataProvider],
    },
  ],
  exports: [
    IMatchRepository,
    IFixtureDataProvider,
    ILiveDataProvider,
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
