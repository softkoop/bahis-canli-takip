/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { FootballApplicationService } from '../services/football-application.service';
import { MatchFilterDto } from '../dto/match.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Fixtures')
@Controller('fixtures')
export class FixtureController {
  constructor(private readonly footballService: FootballApplicationService) {}

  @Get('weekly')
  @ApiOperation({ summary: 'Haftalık fikstürü getir' })
  @ApiResponse({ status: 200, description: 'Fikstür başarıyla getirildi' })
  async getWeeklyFixtures() {
    return this.footballService.getWeeklyFixtures();
  }

  @Get('date/:date')
  @ApiOperation({ summary: 'Belirli bir tarihteki maçları getir' })
  @ApiResponse({ status: 200, description: 'Maçlar başarıyla getirildi' })
  async getMatchesByDate(@Param('date') date: string) {
    return this.footballService.getMatchesByDate(date);
  }

  @Get('live')
  @ApiOperation({ summary: 'Canlı maçları getir' })
  @ApiResponse({ status: 200, description: 'Canlı maçlar başarıyla getirildi' })
  async getLiveMatches() {
    return this.footballService.getLiveMatches();
  }

  @Get('match/:id/stats')
  @ApiOperation({ summary: 'Belirli bir maçın istatistiklerini getir' })
  @ApiResponse({
    status: 200,
    description: 'Maç istatistikleri başarıyla getirildi',
  })
  async getMatchStats(@Param('id', ParseIntPipe) id: number) {
    return this.footballService.getMatchStats(id);
  }

  @Get('filter')
  @ApiOperation({ summary: 'Maçları filtrele' })
  @ApiResponse({
    status: 200,
    description: 'Filtrelenmiş maçlar başarıyla getirildi',
  })
  async filterMatches(@Query() filters: MatchFilterDto) {
    return this.footballService.filterMatches(filters);
  }

  @Get('dates')
  @ApiOperation({ summary: 'Haftalık tarih listesini getir' })
  @ApiResponse({
    status: 200,
    description: 'Tarih listesi başarıyla getirildi',
  })
  async getDateList() {
    return this.footballService.getDateList();
  }

  @Get('leagues')
  @ApiOperation({ summary: 'Lig listesini getir' })
  @ApiResponse({ status: 200, description: 'Ligler başarıyla getirildi' })
  async getLeagues() {
    return this.footballService.getLeagues();
  }
}
