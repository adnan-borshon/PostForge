import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SchedulingService } from './scheduling.service';
import { SchedulePostDto } from './dto/schedule-post.dto';
import { ApiResponse } from '@postforge/types';

@ApiTags('scheduling')
@Controller('scheduling')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SchedulingController {
  constructor(private schedulingService: SchedulingService) {}

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a post for publishing' })
  async schedule(@Request() req, @Body() dto: SchedulePostDto): Promise<ApiResponse<any>> {
    return this.schedulingService.schedulePost(
      req.user.id,
      dto.platformPostId,
      new Date(dto.scheduledAt),
    );
  }

  @Delete(':platformPostId')
  @ApiOperation({ summary: 'Cancel a scheduled post' })
  async cancel(@Request() req, @Param('platformPostId') platformPostId: string): Promise<ApiResponse<any>> {
    return this.schedulingService.cancelSchedule(req.user.id, platformPostId);
  }

  @Get('status/:platformPostId')
  @ApiOperation({ summary: 'Get scheduling status for a post' })
  async getStatus(@Request() req, @Param('platformPostId') platformPostId: string): Promise<ApiResponse<any>> {
    return this.schedulingService.getStatus(req.user.id, platformPostId);
  }
}
