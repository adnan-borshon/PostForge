import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';
import { Platform } from '@postforge/types';

@Injectable()
export class YoutubeOauthService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private cryptoService: CryptoService,
  ) {}

  private getOAuth2Client() {
    return new google.auth.OAuth2(
      this.configService.get('YOUTUBE_CLIENT_ID'),
      this.configService.get('YOUTUBE_CLIENT_SECRET'),
      this.configService.get('YOUTUBE_REDIRECT_URI'),
    );
  }

  getAuthUrl(userId: string) {
    const oauth2Client = this.getOAuth2Client();
    const state = Buffer.from(
      JSON.stringify({ userId, timestamp: Date.now() }),
    ).toString('base64');

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      state,
    });
  }

  async handleCallback(code: string, state: string) {
    let decodedState;
    try {
      decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    } catch (e) {
      throw new BadRequestException('Invalid state');
    }

    const { userId, timestamp } = decodedState;
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      throw new BadRequestException('State expired');
    }

    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelRes = await youtube.channels.list({
      part: ['snippet'],
      mine: true,
    });

    const channel = channelRes.data.items?.[0];
    if (!channel) {
      throw new BadRequestException('No YouTube channel found');
    }

    const accessToken = this.cryptoService.encrypt(tokens.access_token!);
    const refreshToken = tokens.refresh_token 
      ? this.cryptoService.encrypt(tokens.refresh_token) 
      : undefined;
    const expiresAt = tokens.expiry_date 
      ? new Date(tokens.expiry_date) 
      : new Date(Date.now() + 3600 * 1000);

    const account = await this.prisma.platformAccount.upsert({
      where: {
        // We'll use a compound-like ID for simplicity or just handle it
        id: `youtube-${channel.id}`, 
      },
      create: {
        id: `youtube-${channel.id}`,
        userId,
        platform: Platform.YOUTUBE,
        accountName: channel.snippet?.title || 'YouTube Channel',
        accessToken,
        refreshToken: refreshToken || '',
        tokenExpiresAt: expiresAt,
        isActive: true,
      },
      update: {
        accessToken,
        refreshToken: refreshToken || undefined,
        tokenExpiresAt: expiresAt,
        isActive: true,
      },
    });

    return account;
  }
}
