import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { Permissions } from '../auth/decorators/rbac.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InterviewRoundType, InterviewMode } from '@recruitment/shared';

@ApiTags('Interview Scheduling & Conflict Engine')
@Controller('interviews')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post('schedule')
  @Permissions('interviews:schedule')
  @ApiOperation({ summary: 'Schedule interview with conflict prevention and interviewer assignment' })
  async schedule(
    @Body() dto: any,
    @CurrentUser('id') creatorId: string,
  ) {
    return this.interviewsService.scheduleInterview({
      ...dto,
      creatorId,
    });
  }

  @Patch(':id/reschedule')
  @Permissions('interviews:schedule')
  @ApiOperation({ summary: 'Reschedule existing interview slot' })
  async reschedule(
    @Param('id') id: string,
    @Body('scheduledStart') scheduledStart: string,
    @Body('durationMinutes') durationMinutes: number,
    @Body('reason') reason: string,
    @Body('meetingDetails') meetingDetails: string,
    @Body('remarks') remarks: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewsService.rescheduleInterview(
      id,
      scheduledStart,
      durationMinutes,
      userId,
      reason,
      meetingDetails,
      remarks,
    );
  }

  @Patch(':id/cancel')
  @Permissions('interviews:cancel')
  @ApiOperation({ summary: 'Cancel interview with mandatory reason' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewsService.cancelInterview(id, reason, userId);
  }

  @Get()
  @Permissions('interviews:read')
  @ApiOperation({ summary: 'List and paginate interviews with date and search filters' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('interviewerId') interviewerId?: string,
  ) {
    return this.interviewsService.findAllInterviews({
      page,
      limit,
      date,
      startDate,
      endDate,
      status,
      search,
      interviewerId,
    });
  }

  @Get('calendar')
  @Permissions('interviews:read')
  @ApiOperation({ summary: 'Get calendar events for Day/Week/Month views' })
  async getCalendar(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interviewerId') interviewerId?: string,
  ) {
    return this.interviewsService.getCalendarInterviews(startDate, endDate, interviewerId);
  }
}
