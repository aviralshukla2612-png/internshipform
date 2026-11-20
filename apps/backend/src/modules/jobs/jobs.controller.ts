import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService, CreateJobDto } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { Permissions } from '../auth/decorators/rbac.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JobStatus } from '@recruitment/shared';

@ApiTags('Job Positions')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // Public Endpoints
  @Get('public')
  @ApiOperation({ summary: 'List all currently active published jobs for candidate portal' })
  async getPublicJobs() {
    return this.jobsService.findAllPublic();
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get single published job detail by public slug' })
  async getPublicJobBySlug(@Param('slug') slug: string) {
    return this.jobsService.findBySlugPublic(slug);
  }

  // Admin Endpoints
  @Get()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('jobs:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all jobs for HR admin management' })
  async getAllAdmin(
    @Query('search') search?: string,
    @Query('status') status?: JobStatus,
    @Query('department') department?: string,
  ) {
    return this.jobsService.findAllAdmin({ search, status, department });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('jobs:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get job position detail by ID' })
  async getById(@Param('id') id: string) {
    return this.jobsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('jobs:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new job position' })
  async create(
    @Body() dto: CreateJobDto,
    @CurrentUser('id') creatorId: string,
  ) {
    return this.jobsService.create(dto, creatorId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('jobs:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update existing job position' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateJobDto>,
    @CurrentUser('id') updaterId: string,
  ) {
    return this.jobsService.update(id, dto, updaterId);
  }
}
