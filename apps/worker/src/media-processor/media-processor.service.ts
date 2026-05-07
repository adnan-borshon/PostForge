import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import { path as ffprobePath } from '@ffprobe-installer/ffprobe';
import * as fs from 'fs';
import * as path from 'path';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

@Injectable()
export class MediaProcessorService {
  private readonly logger = new Logger(MediaProcessorService.name);

  async extractDuration(inputPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject(err);
        resolve(metadata.format.duration || 0);
      });
    });
  }

  async generateThumbnail(inputPath: string, outputPath: string, atSecond: number = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: [atSecond],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '1280x720',
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });
  }

  async transcodeToMaxResolution(inputPath: string, outputPath: string, maxHeight: number = 1080): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject(err);
        
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (videoStream && videoStream.height && videoStream.height <= maxHeight) {
          this.logger.log(`Skipping transcode, video height is ${videoStream.height}p`);
          // Just copy the file for now if already optimized, or symlink/copy to outputPath
          fs.copyFileSync(inputPath, outputPath);
          return resolve();
        }

        this.logger.log(`Transcoding to ${maxHeight}p...`);
        ffmpeg(inputPath)
          .size(`?x${maxHeight}`)
          .videoCodec('libx244')
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .save(outputPath);
      });
    });
  }
}
