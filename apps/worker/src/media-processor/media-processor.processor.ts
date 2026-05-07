import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MediaProcessorService } from './media-processor.service';
import { MediaStatus, ProjectStatus } from '@postforge/types';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

@Processor('media-processing')
export class MediaProcessor extends WorkerHost {
  private readonly logger = new Logger(MediaProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private mediaProcessorService: MediaProcessorService,
  ) {
    super();
  }

  async process(job: Job<{ mediaId: string; projectId: string }>): Promise<any> {
    const { mediaId, projectId } = job.data;
    this.logger.log(`Processing media ${mediaId} for project ${projectId}`);

    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media || media.status !== MediaStatus.PROCESSING) {
      this.logger.warn(`Media ${mediaId} not found or not in PROCESSING status`);
      return;
    }

    const tempDir = '/tmp/postforge';
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const inputFilePath = path.join(tempDir, `${mediaId}-input`);
    const thumbOutputPath = path.join(tempDir, `${mediaId}-thumb.jpg`);

    try {
      // 1. Download source file
      this.logger.log('Downloading source video...');
      const downloadUrl = await this.storage.generatePresignedDownloadUrl(media.storageKey);
      const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream',
      });
      const writer = fs.createWriteStream(inputFilePath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // 2. Extract duration
      this.logger.log('Extracting duration...');
      const duration = await this.mediaProcessorService.extractDuration(inputFilePath);

      // 3. Generate thumbnail
      this.logger.log('Generating thumbnail...');
      await this.mediaProcessorService.generateThumbnail(inputFilePath, thumbOutputPath, 1);
      const thumbnailKey = `thumbnails/${projectId}/${mediaId}-thumb.jpg`;
      const thumbBuffer = fs.readFileSync(thumbOutputPath);
      await this.storage.uploadFile(thumbnailKey, thumbBuffer, 'image/jpeg');

      // 4. Update Media record
      await this.prisma.media.update({
        where: { id: mediaId },
        data: {
          status: MediaStatus.READY,
          duration,
          thumbnailKey,
        },
      });

      // 5. Update Project status if all media is ready
      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.READY },
      });

      this.logger.log(`Successfully processed media ${mediaId}`);
    } catch (error) {
      this.logger.error(`Failed to process media ${mediaId}: ${error.message}`, error.stack);
      await this.prisma.media.update({
        where: { id: mediaId },
        data: { status: MediaStatus.FAILED },
      });
      throw error;
    } finally {
      // Cleanup
      if (fs.existsSync(inputFilePath)) fs.unlinkSync(inputFilePath);
      if (fs.existsSync(thumbOutputPath)) fs.unlinkSync(thumbOutputPath);
    }
  }
}
