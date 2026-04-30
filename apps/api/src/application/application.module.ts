import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module'; // ← Bunu ekle
import { FootballApplicationService } from './services/football-application.service';
import { FixtureController } from './controllers/fixture.controller';
import { LiveUpdateGateway } from './gateways/live-update.gateway';
import { LiveMatchTrackerService } from './services/live-match-tracker.service';

@Module({
  imports: [InfrastructureModule], // ← InfrastructureModule'ü import et
  controllers: [FixtureController],
  providers: [
    FootballApplicationService,
    LiveMatchTrackerService,
    LiveUpdateGateway,
  ],
})
export class ApplicationModule {}
