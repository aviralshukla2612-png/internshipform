import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JobStatus, EmploymentType } from '@recruitment/shared';

export interface CreateJobDto {
  title: string;
  department: string;
  jobDescription: string;
  requiredQualification: string;
  requiredSkills: string[];
  experienceMinYears?: number;
  experienceMaxYears?: number;
  openingsCount?: number;
  jobLocation: string;
  employmentType?: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  applicationDeadline?: string;
  status?: JobStatus;
}

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const rand = Math.random().toString(36).substring(2, 6);
    return `${base}-${rand}`;
  }

  async create(dto: CreateJobDto, creatorId: string) {
    const slug = this.generateSlug(dto.title);

    const job = await this.prisma.jobPosition.create({
      data: {
        title: dto.title,
        slug,
        department: dto.department,
        jobDescription: dto.jobDescription,
        requiredQualification: dto.requiredQualification,
        requiredSkills: dto.requiredSkills || [],
        experienceMinYears: dto.experienceMinYears ?? 0,
        experienceMaxYears: dto.experienceMaxYears,
        openingsCount: dto.openingsCount ?? 1,
        jobLocation: dto.jobLocation,
        employmentType: (dto.employmentType as any) || EmploymentType.FULL_TIME,
        salaryMin: dto.salaryMin,
        salaryMax: dto.salaryMax,
        applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : null,
        status: (dto.status as any) || JobStatus.DRAFT,
      },
    });

    await this.auditService.log({
      actorId: creatorId,
      action: 'JOB_CREATED',
      entityType: 'JobPosition',
      entityId: job.id,
      afterSnapshot: { title: job.title, slug: job.slug },
    });

    return job;
  }

  async update(id: string, dto: Partial<CreateJobDto>, updaterId: string) {
    const existing = await this.prisma.jobPosition.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Job position not found');
    }

    const updated = await this.prisma.jobPosition.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        department: dto.department ?? existing.department,
        jobDescription: dto.jobDescription ?? existing.jobDescription,
        requiredQualification: dto.requiredQualification ?? existing.requiredQualification,
        requiredSkills: dto.requiredSkills ?? existing.requiredSkills,
        experienceMinYears: dto.experienceMinYears ?? existing.experienceMinYears,
        experienceMaxYears: dto.experienceMaxYears ?? existing.experienceMaxYears,
        openingsCount: dto.openingsCount ?? existing.openingsCount,
        jobLocation: dto.jobLocation ?? existing.jobLocation,
        employmentType: (dto.employmentType as any) ?? existing.employmentType,
        salaryMin: dto.salaryMin ?? existing.salaryMin,
        salaryMax: dto.salaryMax ?? existing.salaryMax,
        applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : existing.applicationDeadline,
        status: (dto.status as any) ?? existing.status,
      },
    });

    await this.auditService.log({
      actorId: updaterId,
      action: 'JOB_UPDATED',
      entityType: 'JobPosition',
      entityId: id,
      beforeSnapshot: { title: existing.title, status: existing.status },
      afterSnapshot: { title: updated.title, status: updated.status },
    });

    return updated;
  }

  async findAllAdmin(query: { search?: string; status?: JobStatus; department?: string }) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.department) where.department = query.department;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { department: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.jobPosition.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });
  }

  async findAllPublic() {
    return this.prisma.jobPosition.findMany({
      where: {
        status: JobStatus.PUBLISHED,
        OR: [
          { applicationDeadline: null },
          { applicationDeadline: { gte: new Date() } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        department: true,
        jobDescription: true,
        requiredQualification: true,
        requiredSkills: true,
        experienceMinYears: true,
        experienceMaxYears: true,
        openingsCount: true,
        jobLocation: true,
        employmentType: true,
        salaryMin: true,
        salaryMax: true,
        applicationDeadline: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlugPublic(slug: string) {
    const job = await this.prisma.jobPosition.findFirst({
      where: {
        slug,
        status: JobStatus.PUBLISHED,
      },
    });

    if (!job) {
      throw new NotFoundException('Published job opening not found or has expired');
    }

    return job;
  }

  async findById(id: string) {
    const job = await this.prisma.jobPosition.findUnique({
      where: { id },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job position not found');
    }

    return job;
  }
}
