import { Module } from '@nestjs/common';
import { YoutubeAdapter } from './youtube/youtube.adapter';
import { PlatformAdapterFactory } from './platform-adapter.factory';

@Module({
  providers: [YoutubeAdapter, PlatformAdapterFactory],
  exports: [PlatformAdapterFactory, YoutubeAdapter],
})
export class PlatformAdaptersModule {}
