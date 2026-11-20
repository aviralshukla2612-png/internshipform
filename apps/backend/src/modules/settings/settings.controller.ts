import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { Permissions } from '../auth/decorators/rbac.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('System Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Permissions('settings:manage')
  @ApiOperation({ summary: 'Get all system settings' })
  async getAll() {
    return this.settingsService.getAll();
  }

  @Put(':key')
  @Permissions('settings:manage')
  @ApiOperation({ summary: 'Update system setting value' })
  async update(
    @Param('key') key: string,
    @Body('value') value: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.settingsService.update(key, value, userId);
  }
}
