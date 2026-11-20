import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { Permissions } from '../auth/decorators/rbac.decorator';

@ApiTags('Audit & Compliance')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions('audit:read')
  @ApiOperation({ summary: 'View tamper-resistant compliance audit trails with filtering and pagination' })
  async getLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('actorId') actorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getAuditLogs({
      page,
      limit,
      action,
      entityType,
      actorId,
      startDate,
      endDate,
    });
  }
}
