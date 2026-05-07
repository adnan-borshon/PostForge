import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaService } from './media.service';
import { GenerateUploadUrlDto } from './dto/generate-upload-url.dto';
import { ApiResponse } from '@postforge/types';

@ApiTags('media')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('media/upload-url')
  @ApiOperation({ summary: 'Generate a presigned upload URL for media' })
  async generateUploadUrl(@Request() req, @Body() dto: GenerateUploadUrlDto): Promise<ApiResponse<any>> {
    return this.mediaService.generateUploadUrl(req.user.id, dto);
  }

  @Post('media/:id/confirm')
  @ApiOperation({ summary: 'Confirm media upload and start processing' })
  async confirmUpload(@Request() req, @Param('id') id: string): Promise<ApiResponse<any>> {
    return this.mediaService.confirmUpload(req.user.id, id);
  }

  @Get('projects/:projectId/media')
  @ApiOperation({ summary: 'Get all media for a project' })
  async findByProject(@Request() req, @Param('projectId') projectId: string): Promise<ApiResponse<any>> {
    return this.mediaService.findByProject(req.user.id, projectId);
  }
}
