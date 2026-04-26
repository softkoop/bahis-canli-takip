import { Module } from '@nestjs/common';

// DomainModule sadece entity'leri ve port'ları export etsin
// Hiçbir service provider'ı olmasın!

@Module({})
export class DomainModule {}
