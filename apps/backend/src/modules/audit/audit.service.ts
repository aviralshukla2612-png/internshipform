import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditActionType } from '@recruitment/shared';

export interface CreateAuditLogParams {
  actorId?: string | null;
  action: AuditActionType | string;
  entityType: string;
  entityId: string;
  beforeSnapshot?: Record<string, any> | null;
  afterSnapshot?: Record<string, any> | null;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: CreateAuditLogParams) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          beforeSnapshotJson: params.beforeSnapshot ? JSON.stringify(params.beforeSnapshot) : null,
          afterSnapshotJson: params.afterSnapshot ? JSON.stringify(params.afterSnapshot) : null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent ? params.userAgent.substring(0, 500) : null,
          correlationId: params.correlationId || null,
        },
      });
    } catch (error) {
      // Never let audit log failure crash business logic, but log critical warning
      this.logger.error(`Failed to record audit log for action ${params.action}:`, error);
    }
  }

  async getAuditLogs(query: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;
    if (query.actorId) where.actorId = query.actorId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
