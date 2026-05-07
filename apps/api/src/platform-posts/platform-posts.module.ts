import { Module } from '@nestjs/common';
import { PlatformPostsService } from './platform-posts.service';
import { PlatformPostsController } from './platform-posts.controller';

@Module({
  providers: [PlatformPostsService],
  controllers: [PlatformPostsController],
  exports: [PlatformPostsService],
})
export class PlatformPostsModule {}
