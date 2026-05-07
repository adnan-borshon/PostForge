import { Controller, Get, Delete, Query, Param, UseGuards, Request, Redirect, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformsService } from './platforms.service';
import { YoutubeOauthService } from './youtube-oauth.service';
import { ApiResponse } from '@postforge/types';
import { Response } from 'express';

@ApiTags('platforms')
@Controller('platforms')
export class PlatformsController {
  constructor(
    private platformsService: PlatformsService,
    private youtubeOauthService: YoutubeOauthService,
  ) {}

  @Get('accounts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List connected platform accounts' })
  async getAccounts(@Request() req): Promise<ApiResponse<any>> {
    return this.platformsService.getAccountsForUser(req.user.id);
  }

  @Delete('accounts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect a platform account' })
  async disconnectAccount(@Request() req, @Param('id') id: string): Promise<ApiResponse<any>> {
    return this.platformsService.disconnectAccount(req.user.id, id);
  }

  @Get('auth/youtube')
  @ApiOperation({ summary: 'Redirect to YouTube OAuth' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Redirect()
  async youtubeAuth(@Request() req) {
    const url = this.youtubeOauthService.getAuthUrl(req.user.id);
    return { url };
  }

  @Get('auth/youtube/callback')
  @ApiOperation({ summary: 'Handle YouTube OAuth callback' })
  async youtubeCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      await this.youtubeOauthService.handleCallback(code, state);
      // Redirect back to frontend
      return res.redirect(`${process.env.FRONTEND_URL}/settings/platforms?success=true`);
    } catch (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings/platforms?error=${encodeURIComponent(error.message)}`);
    }
  }
}
