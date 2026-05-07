import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Platform, ApiResponse } from '@postforge/types';

@Injectable()
export class PlatformsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getAccountsForUser(userId: string): Promise<ApiResponse<any>> {
    const accounts = await this.prisma.platformAccount.findMany({
      where: { userId, isActive: true },
    });
    return { success: true, data: accounts };
  }

  async disconnectAccount(userId: string, accountId: string): Promise<ApiResponse<any>> {
    const account = await this.prisma.platformAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.platformAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    });

    return { success: true };
  }
}
