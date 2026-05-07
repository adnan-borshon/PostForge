import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { QueueService } from '../queue/queue.service';
import { GenerateUploadUrlDto } from './dto/generate-upload-url.dto';
import { MediaStatus, ApiResponse } from '@postforge/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private queue: QueueService,
  ) {}

  async generateUploadUrl(userId: string, dto: GenerateUploadUrlDto): Promise<ApiResponse<any>> {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Access denied');

    const storageKey = `uploads/${userId}/${uuidv4()}-${dto.fileName}`;
    const uploadUrl = await this.storage.generatePresignedUploadUrl(storageKey, dto.mimeType);

    const media = await this.prisma.media.create({
      data: {
        projectId: dto.projectId,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        storageKey: storageKey,
        storageBucket: this.storage.getBucketName(),
        status: MediaStatus.PENDING,
      },
    });

    return {
      success: true,
      data: {
        uploadUrl,
        mediaId: media.id,
        storageKey,
      },
    };
  }

  async confirmUpload(userId: string, mediaId: string): Promise<ApiResponse<any>> {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: { project: true },
    });

    if (!media) throw new NotFoundException('Media not found');
    if (media.project.userId !== userId) throw new ForbiddenException('Access denied');

    if (media.status !== MediaStatus.PENDING) {
      throw new BadRequestException('Media is not in pending status');
    }

    const updatedMedia = await this.prisma.media.update({
      where: { id: mediaId },
      data: { status: MediaStatus.PROCESSING },
    });

    // Add processing job to queue
    await this.queue.addMediaProcessingJob(mediaId, media.projectId);

    return { success: true, data: updatedMedia };
  }

  async findByProject(userId: string, projectId: string): Promise<ApiResponse<any>> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Access denied');

    const media = await this.prisma.media.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: media };
  }
}
