import { Readable } from 'stream';
import { Platform, IPlatformPost, IPlatformAccount } from '@postforge/types';

export interface PublishResult {
  platformVideoId: string;
  platformUrl: string;
  publishedAt: Date;
}

export interface VideoUploadPayload {
  title: string;
  description: string;
  tags: string[];
  scheduledAt?: Date;
  videoStream: Readable;
  thumbnailStream?: Readable;
  mimeType: string;
  fileSize: number;
}

export interface IPlatformAdapter {
  platform: Platform;
  publish(payload: VideoUploadPayload, account: IPlatformAccount): Promise<PublishResult>;
  validateToken(account: IPlatformAccount): Promise<boolean>;
  refreshToken(account: IPlatformAccount): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }>;
}
