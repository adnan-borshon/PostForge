import { Module } from '@nestjs/common';
import { MediaProcessorService } from './media-processor.service';
import { MediaProcessor } from './media-processor.processor';

@Module({
  providers: [MediaProcessorService, MediaProcessor],
})
export class MediaProcessorModule {}
