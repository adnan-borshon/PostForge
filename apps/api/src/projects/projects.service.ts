import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ApiResponse, ProjectStatus } from '@postforge/types';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto): Promise<ApiResponse<any>> {
    const project = await this.prisma.project.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: ProjectStatus.DRAFT,
        userId,
      },
    });
    return { success: true, data: project };
  }

  async findAll(userId: string): Promise<ApiResponse<any>> {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      include: {
        media: true,
        platformPosts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: projects };
  }

  async findOne(userId: string, id: string): Promise<ApiResponse<any>> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        media: true,
        platformPosts: true,
      },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Access denied');

    return { success: true, data: project };
  }

  async update(userId: string, id: string, dto: UpdateProjectDto): Promise<ApiResponse<any>> {
    await this.findOne(userId, id); // check ownership

    const project = await this.prisma.project.update({
      where: { id },
      data: dto,
    });
    return { success: true, data: project };
  }

  async delete(userId: string, id: string): Promise<ApiResponse<any>> {
    await this.findOne(userId, id); // check ownership

    await this.prisma.project.delete({
      where: { id },
    });
    return { success: true };
  }
}
