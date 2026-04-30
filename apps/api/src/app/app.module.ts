import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApplicationModule } from '../application/application.module';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { HttpLoggerMiddleware } from 'src/shared/logger/http-logger.middleware';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule,
    ApplicationModule, // DomainModule zaten InfrastructureModule içinde provide ediliyor
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
