import { Module } from '@nestjs/common';
import { PublishProcessor } from './publish-processor.processor';
import { PlatformAdaptersModule } from '@postforge/platform-adapters/src/platform-adapters.module';
import { WorkerPlatformsModule } from '../platforms/platforms.module';

@Module({
  imports: [PlatformAdaptersModule, WorkerPlatformsModule],
  providers: [PublishProcessor],
})
export class PublishProcessorModule {}
