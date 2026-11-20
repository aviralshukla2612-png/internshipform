import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { Permissions } from '../auth/decorators/rbac.decorator';

@ApiTags('Email Notifications')
@Controller('email')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('logs')
  @Permissions('email:logs:read')
  @ApiOperation({ summary: 'List outgoing transactional email logs' })
  async getLogs(@Query('applicationId') applicationId?: string) {
    return this.emailService.getEmailLogs(applicationId);
  }
}
