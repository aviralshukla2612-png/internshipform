import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActionType } from '@recruitment/shared';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getAll() {
    return this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async update(key: string, value: string, updatedById: string) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }

    const updated = await this.prisma.systemSetting.update({
      where: { key },
      data: {
        value,
        updatedById,
      },
    });

    await this.auditService.log({
      actorId: updatedById,
      action: AuditActionType.SETTINGS_UPDATED,
      entityType: 'SystemSetting',
      entityId: key,
      beforeSnapshot: { value: existing.value },
      afterSnapshot: { value },
    });

    return updated;
  }
}
