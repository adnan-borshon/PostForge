import { Module } from '@nestjs/common';
import { PlatformsService } from './platforms.service';
import { PlatformsController } from './platforms.controller';
import { YoutubeOauthService } from './youtube-oauth.service';
import { TokenRefreshService } from './token-refresh.service';
import { CryptoService } from './crypto.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [PlatformsService, YoutubeOauthService, TokenRefreshService, CryptoService],
  controllers: [PlatformsController],
  exports: [PlatformsService, TokenRefreshService, CryptoService],
})
export class PlatformsModule {}
