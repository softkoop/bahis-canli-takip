import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ApplicationModule } from '../application/application.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    InfrastructureModule,
    ApplicationModule, // DomainModule zaten InfrastructureModule içinde provide ediliyor
  ],
})
export class AppModule {}
