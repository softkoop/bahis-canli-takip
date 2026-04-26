/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { MatchDomainService } from '../../domain/services/match.service';
import { DomainToFrontendMapper } from '../../infrastructure/mappers/domain-to-frontend.mapper';
import { LiveMatchTrackerService } from '../services/live-match-tracker.service';
import { Match } from '../../domain/entities/match.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'live',
})
@Injectable()
export class LiveUpdateGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LiveUpdateGateway.name);

  constructor(
    private readonly matchDomainService: MatchDomainService,
    private readonly frontendMapper: DomainToFrontendMapper,
    @Inject(forwardRef(() => LiveMatchTrackerService))
    private readonly liveTracker: LiveMatchTrackerService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    try {
      const liveMatches = await this.matchDomainService.getLiveMatches();
      const frontendMatches = this.frontendMapper.mapMatches(liveMatches);
      client.emit('initial-live-matches', frontendMatches);
      this.logger.log(
        `Initial live matches sent to client ${client.id}: ${frontendMatches.length} matches`,
      );
    } catch (error) {
      this.logger.error(`Error sending initial live matches:`, error);
      client.emit('error', { message: 'Failed to load live matches' });
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // 🔴 SADECE LOGLA, tracker'ı temizleme (başka client yok)
  }

  /**
   * Frontend'den takip edilecek maç listesini alır
   */
  @SubscribeMessage('track-matches')
  async handleTrackMatches(
    @MessageBody() data: { matchIds: number[] },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Client ${client.id} tracking matches: ${data.matchIds.join(', ')}`,
    );

    // 🔴 DOĞRUDAN tracker'a gönder
    this.liveTracker.updateTrackingList(data.matchIds);

    return { event: 'tracking-updated', data: { matchIds: data.matchIds } };
  }

  /**
   * Belirli bir maça özel güncelleme gönder (Tracker tarafından çağrılır)
   */
  sendMatchSpecificUpdate(matchId: number, updatedMatch: Match) {
    const update = this.frontendMapper.mapLiveUpdate(updatedMatch);
    this.server.emit('match-update', update);
    this.logger.log(`📤 match-update gönderildi: maç ${matchId}`);
  }

  /**
   * Maç takipten çıkarıldığında frontend'e bildir
   */
  sendMatchRemoved(matchId: number) {
    this.server.emit('match-removed', { matchId });
    this.logger.log(`❌ Maç ${matchId} takipten çıkarıldı`);
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

  async onModuleDestroy() {
    this.logger.log('WebSocket Gateway kapatılıyor...');
  }
}
