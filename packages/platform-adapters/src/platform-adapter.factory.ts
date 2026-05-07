import { Injectable } from '@nestjs/common';
import { Platform } from '@postforge/types';
import { IPlatformAdapter } from './index';
import { YoutubeAdapter } from './youtube/youtube.adapter';

@Injectable()
export class PlatformAdapterFactory {
  constructor(private youtubeAdapter: YoutubeAdapter) {}

  getAdapter(platform: Platform): IPlatformAdapter {
    switch (platform) {
      case Platform.YOUTUBE:
        return this.youtubeAdapter;
      default:
        throw new Error(`No adapter for platform: ${platform}`);
    }
  }
}
