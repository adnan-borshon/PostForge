import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { PostStatus, JobStatus, ApiResponse } from '@postforge/types';

@Injectable()
export class SchedulingService {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
  ) {}

  async schedulePost(userId: string, platformPostId: string, scheduledAt: Date): Promise<ApiResponse<any>> {
    const post = await this.prisma.platformPost.findUnique({
      where: { id: platformPostId },
      include: { project: true },
    });

    if (!post) throw new NotFoundException('Post not found');
    if (post.project.userId !== userId) throw new ForbiddenException('Access denied');

    if (post.status !== PostStatus.DRAFT && post.status !== PostStatus.SCHEDULED) {
      throw new BadRequestException('Can only schedule posts in DRAFT or SCHEDULED status');
    }

    // Update post status
    const updatedPost = await this.prisma.platformPost.update({
      where: { id: platformPostId },
      data: {
        status: PostStatus.SCHEDULED,
        scheduledAt,
      },
    });

    // Add delayed job to BullMQ
    const job = await this.queue.addPublishJob(platformPostId, scheduledAt);

    // Upsert ScheduledJob record
    const scheduledJob = await this.prisma.scheduledJob.upsert({
      where: { platformPostId },
      create: {
        platformPostId,
        jobId: job.id!,
        queueName: 'platform-publish',
        scheduledAt,
        status: JobStatus.PENDING,
      },
      update: {
        jobId: job.id!,
        scheduledAt,
        status: JobStatus.PENDING,
        errorMessage: null,
      },
    });

    return { success: true, data: { post: updatedPost, job: scheduledJob } };
  }

  async cancelSchedule(userId: string, platformPostId: string): Promise<ApiResponse<any>> {
    const post = await this.prisma.platformPost.findUnique({
      where: { id: platformPostId },
      include: { project: true },
    });

    if (!post) throw new NotFoundException('Post not found');
    if (post.project.userId !== userId) throw new ForbiddenException('Access denied');

    const scheduledJob = await this.prisma.scheduledJob.findUnique({
      where: { platformPostId },
    });

    if (scheduledJob) {
      await this.queue.removeJob(scheduledJob.jobId, 'platform-publish');
      await this.prisma.scheduledJob.update({
        where: { platformPostId },
        data: { status: JobStatus.CANCELLED },
      });
    }

    const updatedPost = await this.prisma.platformPost.update({
      where: { id: platformPostId },
      data: { status: PostStatus.DRAFT, scheduledAt: null },
    });

    return { success: true, data: updatedPost };
  }

  async getStatus(userId: string, platformPostId: string): Promise<ApiResponse<any>> {
    const post = await this.prisma.platformPost.findUnique({
      where: { id: platformPostId },
      include: { project: true },
    });

    if (!post) throw new NotFoundException('Post not found');
    if (post.project.userId !== userId) throw new ForbiddenException('Access denied');

    const scheduledJob = await this.prisma.scheduledJob.findUnique({
      where: { platformPostId },
    });

    return { success: true, data: { postStatus: post.status, scheduledJob } };
  }
}
