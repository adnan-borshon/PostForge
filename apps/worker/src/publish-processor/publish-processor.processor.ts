import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PlatformAdapterFactory } from '@postforge/platform-adapters/src/platform-adapter.factory';
import { PostStatus, JobStatus, ProjectStatus } from '@postforge/types';
import { Readable } from 'stream';
import { CryptoService } from '../platforms/crypto.service';

@Processor('platform-publish')
export class PublishProcessor extends WorkerHost {
  private readonly logger = new Logger(PublishProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private adapterFactory: PlatformAdapterFactory,
    private cryptoService: CryptoService,
  ) {
    super();
  }

  async process(job: Job<{ platformPostId: string }>): Promise<any> {
    const { platformPostId } = job.data;
    this.logger.log(`Publishing post ${platformPostId}`);

    const post = await this.prisma.platformPost.findUnique({
      where: { id: platformPostId },
      include: {
        platformAccount: true,
        project: {
          include: { media: true }
        }
      }
    });

    if (!post || post.status !== PostStatus.SCHEDULED) {
      this.logger.warn(`Post ${platformPostId} not found or not in SCHEDULED status`);
      return;
    }

    // Decrypt tokens for adapter
    const decryptedAccount = {
      ...post.platformAccount,
      accessToken: this.cryptoService.decrypt(post.platformAccount.accessToken),
      refreshToken: post.platformAccount.refreshToken 
        ? this.cryptoService.decrypt(post.platformAccount.refreshToken) 
        : '',
    };

    try {
      // 1. Update statuses
      await this.prisma.platformPost.update({
        where: { id: platformPostId },
        data: { status: PostStatus.PUBLISHING },
      });
      await this.prisma.scheduledJob.update({
        where: { platformPostId },
        data: { status: JobStatus.PROCESSING, lastAttemptAt: new Date() },
      });

      // 2. Prepare media
      const media = post.project.media[0];
      const videoStream = await this.storage.getFileStream(media.storageKey);
      
      let thumbnailStream: Readable | undefined;
      if (media.thumbnailKey) {
        thumbnailStream = (await this.storage.getFileStream(media.thumbnailKey)) as Readable;
      }

      // 3. Publish via adapter
      const adapter = this.adapterFactory.getAdapter(post.platform);
      
      // Token check/refresh if needed
      if (!(await adapter.validateToken(decryptedAccount))) {
        this.logger.log(`Refreshing token for account ${post.platformAccount.id}`);
        const newTokens = await adapter.refreshToken(decryptedAccount);
        
        // Encrypt new tokens for DB
        const encryptedAccessToken = this.cryptoService.encrypt(newTokens.accessToken);
        const encryptedRefreshToken = newTokens.refreshToken 
          ? this.cryptoService.encrypt(newTokens.refreshToken) 
          : post.platformAccount.refreshToken;

        await this.prisma.platformAccount.update({
          where: { id: post.platformAccount.id },
          data: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiresAt: newTokens.expiresAt,
          },
        });

        // Update local decrypted object
        decryptedAccount.accessToken = newTokens.accessToken;
        decryptedAccount.refreshToken = newTokens.refreshToken;
      }

      const result = await adapter.publish({
        title: post.title,
        description: post.description || '',
        tags: post.tags,
        scheduledAt: post.scheduledAt || undefined,
        videoStream: videoStream as Readable,
        thumbnailStream,
        mimeType: media.mimeType,
        fileSize: media.fileSize,
      }, decryptedAccount);

      // 4. Success updates
      await this.prisma.platformPost.update({
        where: { id: platformPostId },
        data: {
          status: PostStatus.PUBLISHED,
          platformVideoId: result.platformVideoId,
          platformUrl: result.platformUrl,
          publishedAt: result.publishedAt,
        },
      });

      await this.prisma.project.update({
        where: { id: post.projectId },
        data: { status: ProjectStatus.PUBLISHED },
      });

      await this.prisma.scheduledJob.update({
        where: { platformPostId },
        data: { status: JobStatus.COMPLETED },
      });

      this.logger.log(`Successfully published post ${platformPostId}`);
    } catch (error) {
      this.logger.error(`Failed to publish post ${platformPostId}: ${error.message}`, error.stack);
      
      const attempts = await this.prisma.scheduledJob.findUnique({
        where: { platformPostId },
        select: { attempts: true }
      });

      await this.prisma.platformPost.update({
        where: { id: platformPostId },
        data: { status: PostStatus.FAILED, errorMessage: error.message },
      });

      await this.prisma.scheduledJob.update({
        where: { platformPostId },
        data: { 
          status: JobStatus.FAILED, 
          errorMessage: error.message,
          attempts: (attempts?.attempts || 0) + 1,
        },
      });

      throw error; // Re-throw for BullMQ retry
    }
  }
}
