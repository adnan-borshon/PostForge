import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ApiResponse } from '@postforge/types';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  async create(@Request() req, @Body() dto: CreateProjectDto): Promise<ApiResponse<any>> {
    return this.projectsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user projects' })
  async findAll(@Request() req): Promise<ApiResponse<any>> {
    return this.projectsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single project' })
  async findOne(@Request() req, @Param('id') id: string): Promise<ApiResponse<any>> {
    return this.projectsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateProjectDto): Promise<ApiResponse<any>> {
    return this.projectsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  async delete(@Request() req, @Param('id') id: string): Promise<ApiResponse<any>> {
    return this.projectsService.delete(req.user.id, id);
  }
}
