import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { Permissions } from '../auth/decorators/rbac.decorator';

@ApiTags('Reports & Analytics')
@Controller('reports')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Permissions('applications:read')
  @ApiOperation({ summary: 'Real-time database aggregated recruitment metrics and charts' })
  async getDashboard() {
    return this.reportsService.getDashboardMetrics();
  }
}
