import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformPostsService } from './platform-posts.service';
import { CreatePlatformPostDto } from './dto/create-platform-post.dto';
import { UpdatePlatformPostDto } from './dto/update-platform-post.dto';
import { ApiResponse } from '@postforge/types';

@ApiTags('platform-posts')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlatformPostsController {
  constructor(private platformPostsService: PlatformPostsService) {}

  @Post('projects/:projectId/posts')
  @ApiOperation({ summary: 'Create a platform post for a project' })
  async create(
    @Request() req,
    @Param('projectId') projectId: string,
    @Body() dto: CreatePlatformPostDto,
  ): Promise<ApiResponse<any>> {
    return this.platformPostsService.create(req.user.id, projectId, dto);
  }

  @Get('projects/:projectId/posts')
  @ApiOperation({ summary: 'List posts for a project' })
  async findByProject(@Request() req, @Param('projectId') projectId: string): Promise<ApiResponse<any>> {
    return this.platformPostsService.findByProject(req.user.id, projectId);
  }

  @Patch('platform-posts/:id')
  @ApiOperation({ summary: 'Update a platform post' })
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdatePlatformPostDto): Promise<ApiResponse<any>> {
    return this.platformPostsService.update(req.user.id, id, dto);
  }
}
