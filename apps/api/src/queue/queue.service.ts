import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('media-processing') private mediaQueue: Queue,
    @InjectQueue('platform-publish') private publishQueue: Queue,
  ) {}

  async addMediaProcessingJob(mediaId: string, projectId: string) {
    return this.mediaQueue.add('process', { mediaId, projectId });
  }

  async addPublishJob(platformPostId: string, scheduledAt: Date) {
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    return this.publishQueue.add(
      'publish',
      { platformPostId },
      { delay, jobId: `publish-${platformPostId}` },
    );
  }

  async removeJob(jobId: string, queueName: 'media-processing' | 'platform-publish') {
    const queue = queueName === 'media-processing' ? this.mediaQueue : this.publishQueue;
    const job = await queue.getJob(jobId);
    if (job) await job.remove();
  }

  async getJobStatus(jobId: string, queueName: 'media-processing' | 'platform-publish') {
    const queue = queueName === 'media-processing' ? this.mediaQueue : this.publishQueue;
    const job = await queue.getJob(jobId);
    return job ? await job.getState() : 'not-found';
  }
}
