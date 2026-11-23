import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  InterviewRoundType,
  InterviewMode,
  InterviewStatus,
  ApplicationStatus,
  AuditActionType,
} from '@recruitment/shared';

export interface ScheduleInterviewParams {
  applicationId: string;
  roundType: InterviewRoundType;
  interviewMode: InterviewMode;
  scheduledStart: string; // ISO String
  durationMinutes: number;
  interviewerId: string;
  meetingDetails: string;
  instructions?: string;
  remarks?: string;
  openWhatsApp?: boolean;
  creatorId: string;
}

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async scheduleInterview(params: ScheduleInterviewParams) {
    const start = new Date(params.scheduledStart);
    if (isNaN(start.getTime())) {
      throw new BadRequestException('Invalid interview start timestamp. Please pick a valid date and time.');
    }

    // Allow scheduling today / timezone grace window (only block if > 24 hours in the past)
    const pastLimit = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (start < pastLimit) {
      throw new BadRequestException('Cannot schedule an interview more than 24 hours in the past.');
    }

    const duration = Math.max(15, Math.min(240, Number(params.durationMinutes) || 45));
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // Verify Application Exists
    const app = await this.prisma.jobApplication.findUnique({
      where: { id: params.applicationId },
      include: { candidate: true, jobPosition: true },
    });
    if (!app) {
      throw new NotFoundException('Job application not found');
    }

    // Verify Interviewer Exists (defaults to creator or first active admin)
    let targetInterviewerId = params.interviewerId || params.creatorId;
    let interviewer = targetInterviewerId
      ? await this.prisma.adminUser.findUnique({ where: { id: targetInterviewerId } })
      : null;

    if (!interviewer) {
      interviewer = await this.prisma.adminUser.findFirst({
        where: { status: 'ACTIVE' },
      });
    }

    if (!interviewer) {
      throw new NotFoundException('No active administrator or interviewer found');
    }
    targetInterviewerId = interviewer.id;

    // CONFLICT ENGINE: Check Interviewer Availability
    const interviewerConflict = await this.prisma.interview.findFirst({
      where: {
        status: InterviewStatus.SCHEDULED as any,
        assignments: {
          some: { interviewerId: targetInterviewerId },
        },
        scheduledStart: { lt: end },
        scheduledEnd: { gt: start },
      },
      include: {
        application: {
          include: { candidate: { select: { fullName: true } } },
        },
      },
    });

    if (interviewerConflict) {
      throw new ConflictException(
        `Scheduling Conflict: Interviewer ${interviewer.fullName} is already booked for another interview with candidate "${interviewerConflict.application.candidate.fullName}" from ${interviewerConflict.scheduledStart.toLocaleTimeString()} to ${interviewerConflict.scheduledEnd.toLocaleTimeString()}.`,
      );
    }

    // CONFLICT ENGINE: Check Candidate Availability
    const candidateConflict = await this.prisma.interview.findFirst({
      where: {
        applicationId: params.applicationId,
        status: InterviewStatus.SCHEDULED as any,
        scheduledStart: { lt: end },
        scheduledEnd: { gt: start },
      },
    });

    if (candidateConflict) {
      throw new ConflictException(
        'Scheduling Conflict: Candidate already has an active interview scheduled during this exact time window.',
      );
    }

    // Atomic schedule creation
    const interview = await this.prisma.$transaction(async (tx) => {
      const newInterview = await tx.interview.create({
        data: {
          applicationId: params.applicationId,
          roundType: params.roundType as any,
          interviewMode: params.interviewMode as any,
          scheduledStart: start,
          scheduledEnd: end,
          durationMinutes: duration,
          meetingDetails: params.meetingDetails,
          instructions: params.instructions,
          remarks: params.remarks,
          status: InterviewStatus.SCHEDULED as any,
          assignments: {
            create: {
              interviewerId: targetInterviewerId,
              isLead: true,
            },
          },
        },
        include: {
          assignments: {
            include: { interviewer: { select: { id: true, fullName: true, email: true } } },
          },
          application: {
            include: { candidate: true, jobPosition: true },
          },
        },
      });

      // Update application lifecycle status
      await tx.jobApplication.update({
        where: { id: params.applicationId },
        data: { status: ApplicationStatus.INTERVIEW_SCHEDULED as any },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: params.applicationId,
          previousStatus: app.status,
          newStatus: ApplicationStatus.INTERVIEW_SCHEDULED as any,
          changedById: params.creatorId,
          reason: `Interview scheduled: ${params.roundType} on ${start.toLocaleDateString()}`,
        },
      });

      if (params.remarks && params.remarks.trim()) {
        await tx.candidateNote.create({
          data: {
            applicationId: params.applicationId,
            authorId: params.creatorId,
            note: `[Interview Scheduled - ${String(params.roundType).replace(/_/g, " ")}]: ${params.remarks.trim()}`,
          },
        });
      }

      return newInterview;
    });

    await this.auditService.log({
      actorId: params.creatorId,
      action: AuditActionType.INTERVIEW_SCHEDULED,
      entityType: 'Interview',
      entityId: interview.id,
      afterSnapshot: {
        applicationId: params.applicationId,
        candidateName: app.candidate.fullName,
        interviewerName: interviewer.fullName,
        scheduledStart: start.toISOString(),
        remarks: params.remarks,
      },
    });

    return interview;
  }

  async rescheduleInterview(
    id: string,
    newStartIso: string,
    durationMinutes: number,
    rescheduledById: string,
    reason?: string,
  ) {
    const existing = await this.prisma.interview.findUnique({
      where: { id },
      include: { assignments: true, application: { include: { candidate: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Interview not found');
    }

    const start = new Date(newStartIso);
    if (start < new Date()) {
      throw new BadRequestException('Rescheduled date cannot be in the past.');
    }
    const duration = durationMinutes || existing.durationMinutes;
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // Conflict Check
    const leadAssignment = existing.assignments.find((a) => a.isLead) || existing.assignments[0];
    if (leadAssignment) {
      const conflict = await this.prisma.interview.findFirst({
        where: {
          id: { not: id },
          status: InterviewStatus.SCHEDULED as any,
          assignments: { some: { interviewerId: leadAssignment.interviewerId } },
          scheduledStart: { lt: end },
          scheduledEnd: { gt: start },
        },
      });
      if (conflict) {
        throw new ConflictException('Selected slot conflicts with interviewer existing schedule.');
      }
    }

    const updated = await this.prisma.interview.update({
      where: { id },
      data: {
        scheduledStart: start,
        scheduledEnd: end,
        durationMinutes: duration,
        status: InterviewStatus.RESCHEDULED as any,
      },
    });

    await this.auditService.log({
      actorId: rescheduledById,
      action: AuditActionType.INTERVIEW_RESCHEDULED,
      entityType: 'Interview',
      entityId: id,
      beforeSnapshot: { scheduledStart: existing.scheduledStart },
      afterSnapshot: { scheduledStart: start, reason },
    });

    return updated;
  }

  async cancelInterview(id: string, reason: string, cancelledById: string) {
    const existing = await this.prisma.interview.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Interview not found');
    }

    const updated = await this.prisma.interview.update({
      where: { id },
      data: {
        status: InterviewStatus.CANCELLED as any,
        cancellationReason: reason,
      },
    });

    await this.auditService.log({
      actorId: cancelledById,
      action: AuditActionType.INTERVIEW_CANCELLED,
      entityType: 'Interview',
      entityId: id,
      afterSnapshot: { status: 'CANCELLED', reason },
    });

    return updated;
  }

  async getCalendarInterviews(startDate: string, endDate: string, interviewerId?: string) {
    const where: any = {
      scheduledStart: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (interviewerId) {
      where.assignments = { some: { interviewerId } };
    }

    return this.prisma.interview.findMany({
      where,
      orderBy: { scheduledStart: 'asc' },
      include: {
        application: {
          include: {
            candidate: { select: { fullName: true, email: true, mobileNumber: true } },
            jobPosition: { select: { title: true, department: true } },
          },
        },
        assignments: {
          include: { interviewer: { select: { id: true, fullName: true, email: true } } },
        },
      },
    });
  }
}
