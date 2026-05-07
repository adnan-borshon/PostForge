import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlatformPostDto } from './dto/create-platform-post.dto';
import { UpdatePlatformPostDto } from './dto/update-platform-post.dto';
import { ApiResponse, PostStatus, MediaStatus } from '@postforge/types';

@Injectable()
export class PlatformPostsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, projectId: string, dto: CreatePlatformPostDto): Promise<ApiResponse<any>> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { media: true },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Access denied');

    // Rule: Need at least one READY media
    const readyMedia = project.media.find(m => m.status === MediaStatus.READY);
    if (!readyMedia) {
      throw new BadRequestException('No ready media found for this project. Please wait for processing to finish.');
    }

    const platformAccount = await this.prisma.platformAccount.findUnique({
      where: { id: dto.platformAccountId },
    });
    if (!platformAccount || platformAccount.userId !== userId) {
      throw new BadRequestException('Invalid platform account');
    }

    const post = await this.prisma.platformPost.create({
      data: {
        projectId,
        platformAccountId: dto.platformAccountId,
        status: PostStatus.DRAFT,
        platform: platformAccount.platform,
        title: dto.title,
        description: dto.description,
        tags: dto.tags || [],
      },
    });

    return { success: true, data: post };
  }

  async findByProject(userId: string, projectId: string): Promise<ApiResponse<any>> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Access denied');

    const posts = await this.prisma.platformPost.findMany({
      where: { projectId },
      include: { platformAccount: true },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: posts };
  }

  async update(userId: string, id: string, dto: UpdatePlatformPostDto): Promise<ApiResponse<any>> {
    const post = await this.prisma.platformPost.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!post) throw new NotFoundException('Post not found');
    if (post.project.userId !== userId) throw new ForbiddenException('Access denied');

    if (post.status !== PostStatus.DRAFT) {
      throw new BadRequestException('Can only update posts in DRAFT status');
    }

    const updatedPost = await this.prisma.platformPost.update({
      where: { id },
      data: dto,
    });

    return { success: true, data: updatedPost };
  }
}
