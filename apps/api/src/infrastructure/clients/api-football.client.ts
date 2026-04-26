// src/infrastructure/clients/api-football.client.ts
import { Injectable } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import {
  ApiFootballResponse,
  FixtureItem,
  FixtureStatisticsResponse,
  LeagueItem,
} from './api-football.types';

@Injectable()
export class ApiFootballClient {
  private readonly baseUrl = 'https://v3.football.api-sports.io/';
  private readonly headers = {
    'x-apisports-key': process.env.API_FOOTBALL_KEY,
  };

  private async get<T>(endpoint: string): Promise<ApiFootballResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`🌐 API-Football Request: ${url}`);
    try {
      const response: AxiosResponse<ApiFootballResponse<T>> = await axios.get(
        url,
        {
          headers: this.headers,
        },
      );
      return response.data;
    } catch (error) {
      console.error(
        `API-Football Request Failed: ${url}`,
        (error as AxiosError).response?.data || (error as Error).message,
      );
      throw error;
    }
  }

  async getFixtures(params: {
    live?: string;
    date?: string;
    league?: number;
    season?: number;
  }): Promise<ApiFootballResponse<FixtureItem[]>> {
    const queryParams = new URLSearchParams();
    if (params.live) queryParams.append('live', params.live);
    if (params.date) queryParams.append('date', params.date);
    if (params.league) queryParams.append('league', params.league.toString());
    if (params.season) queryParams.append('season', params.season.toString());

    const endpoint = `fixtures${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.get<FixtureItem[]>(endpoint);
  }

  async getFixtureStatistics(
    fixtureId: number,
  ): Promise<ApiFootballResponse<FixtureStatisticsResponse['response']>> {
    return this.get<FixtureStatisticsResponse['response']>(
      `fixtures/statistics?fixture=${fixtureId}`,
    );
  }

  async getLeagues(params?: {
    season?: number;
  }): Promise<ApiFootballResponse<LeagueItem[]>> {
    const endpoint = params?.season
      ? `leagues?season=${params.season}`
      : 'leagues';
    return this.get<LeagueItem[]>(endpoint);
  }
}
