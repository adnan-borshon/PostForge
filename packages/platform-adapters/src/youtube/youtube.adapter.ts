import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Platform, IPlatformAccount } from '@postforge/types';
import { IPlatformAdapter, VideoUploadPayload, PublishResult } from '../index';

@Injectable()
export class YoutubeAdapter implements IPlatformAdapter {
  platform = Platform.YOUTUBE;

  private getOAuth2Client(account: IPlatformAccount) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
      expiry_date: account.tokenExpiresAt.getTime(),
    });

    return oauth2Client;
  }

  async validateToken(account: IPlatformAccount): Promise<boolean> {
    try {
      const client = this.getOAuth2Client(account);
      const tokenInfo = await client.getTokenInfo(account.accessToken);
      return !!tokenInfo.scopes?.includes('https://www.googleapis.com/auth/youtube.upload');
    } catch (error) {
      return false;
    }
  }

  async refreshToken(account: IPlatformAccount) {
    const client = this.getOAuth2Client(account);
    const { credentials } = await client.refreshAccessToken();
    
    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token || account.refreshToken,
      expiresAt: new Date(credentials.expiry_date!),
    };
  }

  async publish(payload: VideoUploadPayload, account: IPlatformAccount): Promise<PublishResult> {
    const auth = this.getOAuth2Client(account);
    const youtube = google.youtube({ version: 'v3', auth });

    const privacyStatus = payload.scheduledAt && payload.scheduledAt > new Date() 
      ? 'private' 
      : 'public';

    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: payload.title,
          description: payload.description,
          tags: payload.tags,
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus,
          publishAt: privacyStatus === 'private' ? payload.scheduledAt?.toISOString() : undefined,
        },
      },
      media: {
        body: payload.videoStream,
      },
    });

    const videoId = res.data.id!;

    if (payload.thumbnailStream) {
      await youtube.thumbnails.set({
        videoId,
        media: {
          body: payload.thumbnailStream,
        },
      });
    }

    return {
      platformVideoId: videoId,
      platformUrl: `https://www.youtube.com/watch?v=${videoId}`,
      publishedAt: new Date(),
    };
  }
}
