/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MatchDomainService } from '../../domain/services/match.service';
import { DomainToFrontendMapper } from '../../infrastructure/mappers/domain-to-frontend.mapper';
import { LiveMatchTrackerService } from '../services/live-match-tracker.service';
import { MatchEvents } from '../events/match.events';
import { MatchStats } from 'src/domain/value-objects/match-stats.value-objects';

interface LiveMatchData {
  matchId: number;
  minute: number;
  score: { home: number; away: number };
  isLive: boolean;
  stats?: any; // Takip edilen maçlar için stats
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'live',
})
@Injectable()
export class LiveUpdateGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LiveUpdateGateway.name);

  constructor(
    private readonly matchDomainService: MatchDomainService,
    private readonly frontendMapper: DomainToFrontendMapper,
    private readonly liveTracker: LiveMatchTrackerService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // try {
    //   const liveMatches = await this.matchDomainService.getLiveMatches();
    //   const frontendMatches = this.frontendMapper.mapMatches(liveMatches);
    //   client.emit('initial-live-matches', frontendMatches);
    //   this.logger.log(
    //     `Initial live matches sent: ${frontendMatches.length} matches`,
    //   );
    // } catch (error) {
    //   this.logger.error(`Error sending initial live matches:`, error);
    //   client.emit('error', { message: 'Failed to load live matches' });
    // }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('track-matches')
  async handleTrackMatches(
    @MessageBody() data: { matchIds: number[] },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Client ${client.id} tracking matches: ${data.matchIds.join(', ')}`,
    );
    this.liveTracker.updateTrackingList(data.matchIds);
    return { event: 'tracking-updated', data: { matchIds: data.matchIds } };
  }

  @SubscribeMessage('get-live-matches')
  async handleGetLiveMatches(@ConnectedSocket() client: Socket) {
    try {
      const liveMatches = await this.matchDomainService.getLiveMatches();
      const frontendMatches = this.frontendMapper.mapMatches(liveMatches);
      client.emit('live-matches-list', frontendMatches);
    } catch (error) {
      this.logger.error('Error getting live matches:', error);
      client.emit('error', { message: 'Failed to get live matches' });
    }
  }

  // 🔴 EVENT DİNLEYİCİLER

  @OnEvent(MatchEvents.STATS_UPDATED)
  handleStatsUpdated(payload: {
    matchId: number;
    minute: number;
    stats: MatchStats;
  }) {
    const update = {
      id: payload.matchId,
      minute: payload.minute,
      stats: payload.stats,
    };
    this.server.emit('match-update', update);
    this.logger.log(`📤 Stats update sent for match ${payload.matchId}`);
  }

  @OnEvent(MatchEvents.MINUTE_UPDATED)
  handleMinuteUpdated(payload: {
    matchId: number;
    minute: number;
    score: {
      home: number;
      away: number;
    };
    isLive: boolean;
  }) {
    const update = {
      id: payload.matchId,
      minute: payload.minute,
      score: payload.score,
      isLive: payload.isLive,
    };
    this.server.emit('match-update', update);
    this.logger.log(
      `⏱️ Minute update sent for match ${payload.matchId}: ${payload.minute}'`,
    );
  }

  @OnEvent(MatchEvents.MATCH_REMOVED)
  handleMatchRemoved(payload: { matchId: number }) {
    this.server.emit('match-removed', { matchId: payload.matchId });
    this.logger.log(`❌ Match ${payload.matchId} removed from tracking`);
  }

  // live-update.gateway.ts
  @OnEvent(MatchEvents.ALL_MATCHES_UPDATED)
  handleAllMatchesUpdated(payload: {
    matches: LiveMatchData[];
    timestamp: string;
  }) {
    // Tüm canlı maçların güncel verisini tek seferde gönder
    this.server.emit('live-matches-update', payload);
    this.logger.log(`📤 ${payload.matches.length} canlı maç güncellendi`);
  }

  async onModuleDestroy() {
    this.logger.log('WebSocket Gateway shutting down...');
  }
}
