import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { Permissions } from '../auth/decorators/rbac.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubmitFeedbackDto } from '@recruitment/shared';

@ApiTags('Interview Feedback & Scoring')
@Controller('interview-feedback')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @Permissions('feedback:submit')
  @ApiOperation({ summary: 'Submit interview scorecard & ratings (immutable lock upon submission)' })
  async submit(
    @Body() dto: SubmitFeedbackDto,
    @CurrentUser() user: any,
  ) {
    return this.feedbackService.submitFeedback(dto, user.id, user.roles || []);
  }

  @Get(':interviewId')
  @Permissions('feedback:read')
  @ApiOperation({ summary: 'Get all submitted evaluations for an interview round' })
  async getByInterview(@Param('interviewId') interviewId: string) {
    return this.feedbackService.getInterviewFeedback(interviewId);
  }
}
