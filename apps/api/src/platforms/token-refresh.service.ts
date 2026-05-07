import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenRefreshService {
  private readonly logger = new Logger(TokenRefreshService.name);

  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private configService: ConfigService,
  ) {}

  private getOAuth2Client() {
    return new google.auth.OAuth2(
      this.configService.get('YOUTUBE_CLIENT_ID'),
      this.configService.get('YOUTUBE_CLIENT_SECRET'),
      this.configService.get('YOUTUBE_REDIRECT_URI'),
    );
  }

  async ensureFreshToken(platformAccountId: string) {
    const account = await this.prisma.platformAccount.findUnique({
      where: { id: platformAccountId },
    });

    if (!account || !account.refreshToken) return null;

    // If expires in more than 5 minutes, it's fine
    if (account.tokenExpiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
      return account;
    }

    return this.refresh(account);
  }

  async refresh(account: any) {
    try {
      this.logger.log(`Refreshing token for account ${account.id}`);
      const oauth2Client = this.getOAuth2Client();
      const decryptedRefreshToken = this.cryptoService.decrypt(account.refreshToken);
      
      oauth2Client.setCredentials({
        refresh_token: decryptedRefreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      const accessToken = this.cryptoService.encrypt(credentials.access_token!);
      const expiresAt = new Date(credentials.expiry_date!);

      const updatedAccount = await this.prisma.platformAccount.update({
        where: { id: account.id },
        data: {
          accessToken,
          tokenExpiresAt: expiresAt,
        },
      });

      return updatedAccount;
    } catch (error) {
      this.logger.error(`Failed to refresh token for ${account.id}: ${error.message}`);
      await this.prisma.platformAccount.update({
        where: { id: account.id },
        data: { isActive: false },
      });
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log('Running proactive token refresh...');
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

    const expiringAccounts = await this.prisma.platformAccount.findMany({
      where: {
        isActive: true,
        tokenExpiresAt: {
          lte: oneHourFromNow,
        },
        refreshToken: {
          not: '',
        },
      },
    });

    this.logger.log(`Found ${expiringAccounts.length} accounts to refresh`);

    for (const account of expiringAccounts) {
      try {
        await this.refresh(account);
      } catch (e) {
        // Continue with others
      }
    }
  }
}
