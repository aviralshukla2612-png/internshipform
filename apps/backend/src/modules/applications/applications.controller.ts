import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { Permissions } from '../auth/decorators/rbac.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApplicationStatus, Gender } from '@recruitment/shared';

@ApiTags('Applications & Candidate Flow')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // Public candidate submission
  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit new multi-step candidate application' })
  async submit(@Body() dto: any, @Req() req: Request) {
    const meta = {
      ip: req.ip || req.socket.remoteAddress,
      ua: req.headers['user-agent'],
    };
    return this.applicationsService.submitApplication(dto, meta);
  }

  // Public candidate tracking
  @Get('track')
  @ApiOperation({ summary: 'Track application status by Application ID and Email/Mobile' })
  async track(
    @Query('code') code: string,
    @Query('contact') contact: string,
  ) {
    return this.applicationsService.trackApplication(code, contact);
  }

  // Admin listing
  @Get()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('applications:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List and filter applications for Admin/HR table' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: ApplicationStatus,
    @Query('jobId') jobId?: string,
    @Query('gender') gender?: Gender,
    @Query('isFresher') isFresher?: boolean,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.applicationsService.findAllApplications({
      page,
      limit,
      search,
      status,
      jobId,
      gender,
      isFresher,
      sortField,
      sortOrder,
    });
  }

  // Admin application detail with all 8 tabs
  @Get(':id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('applications:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full candidate profile & application detail' })
  async getDetail(@Param('id') id: string) {
    return this.applicationsService.getApplicationDetail(id);
  }

  // Update status (shortlist, reject, hold)
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('applications:status:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update application lifecycle status with audit trail' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ApplicationStatus,
    @Body('reason') reason: string,
    @CurrentUser('id') changedById: string,
  ) {
    return this.applicationsService.updateStatus(id, status, reason, changedById);
  }

  // Add HR internal note
  @Post(':id/notes')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('candidates:edit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add internal HR evaluation note' })
  async addNote(
    @Param('id') id: string,
    @Body('note') note: string,
    @CurrentUser('id') authorId: string,
  ) {
    return this.applicationsService.addNote(id, authorId, note);
  }
}
