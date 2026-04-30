import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { patchNestjsSwagger } from '@anatine/zod-nestjs';
import { AppLogger } from './shared/logger/app-logger.service';

async function bootstrap() {
  const logger = new AppLogger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Logger hazır olana kadar logları buffer'la
  });

  app.useLogger(logger);

  // Zod patch'ini uygula
  patchNestjsSwagger();

  // CORS ayarları
  app.enableCors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger dokümantasyonu
  const config = new DocumentBuilder()
    .setTitle('Football Live API')
    .setDescription("Canlı futbol maçları ve istatistikleri API'si")
    .setVersion('1.0')
    .addTag('Fixtures')
    .addTag('Live')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`✅ Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
  logger.log(`🔌 WebSocket endpoint: ws://localhost:${port}/live`);
}
void bootstrap();
