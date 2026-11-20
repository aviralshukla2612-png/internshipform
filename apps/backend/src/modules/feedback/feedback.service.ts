import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  SubmitFeedbackDto,
  AuditActionType,
  UserRoleType,
} from '@recruitment/shared';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async submitFeedback(dto: SubmitFeedbackDto, interviewerId: string, userRoles: string[]) {
    // 1. Validate Ratings are within 1 to 5 bounds
    const ratings = [
      dto.technicalRating,
      dto.communicationRating,
      dto.problemSolvingRating,
      dto.experienceRating,
      dto.overallRating,
    ];
    for (const r of ratings) {
      if (r < 1 || r > 5 || !Number.isInteger(r)) {
        throw new BadRequestException('Ratings must be integers between 1 and 5');
      }
    }

    // 2. Find Interview & Assignment
    const interview = await this.prisma.interview.findUnique({
      where: { id: dto.interviewId },
      include: {
        assignments: true,
      },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    // Check if interviewer is assigned (unless super admin)
    const isSuperAdmin = userRoles.includes(UserRoleType.SUPER_ADMIN);
    const assignment = interview.assignments.find((a) => a.interviewerId === interviewerId);

    if (!assignment && !isSuperAdmin) {
      throw new ForbiddenException('You are not assigned to evaluate this candidate interview');
    }

    const assignmentId = assignment ? assignment.id : interview.assignments[0]?.id;
    if (!assignmentId) {
      throw new BadRequestException('No interviewer assignment found for this interview');
    }

    // Check if feedback already submitted and locked
    const existingFeedback = await this.prisma.interviewFeedback.findUnique({
      where: { assignmentId },
    });

    if (existingFeedback && existingFeedback.isLocked) {
      throw new ForbiddenException('Submitted interview feedback is locked and cannot be edited');
    }

    const feedback = await this.prisma.interviewFeedback.upsert({
      where: { assignmentId },
      update: {
        technicalRating: dto.technicalRating,
        communicationRating: dto.communicationRating,
        problemSolvingRating: dto.problemSolvingRating,
        experienceRating: dto.experienceRating,
        overallRating: dto.overallRating,
        strengths: dto.strengths,
        weaknesses: dto.weaknesses,
        interviewNotes: dto.interviewNotes,
        recommendation: dto.recommendation as any,
        isLocked: true,
      },
      create: {
        interviewId: dto.interviewId,
        assignmentId,
        interviewerId,
        technicalRating: dto.technicalRating,
        communicationRating: dto.communicationRating,
        problemSolvingRating: dto.problemSolvingRating,
        experienceRating: dto.experienceRating,
        overallRating: dto.overallRating,
        strengths: dto.strengths,
        weaknesses: dto.weaknesses,
        interviewNotes: dto.interviewNotes,
        recommendation: dto.recommendation as any,
        isLocked: true,
      },
    });

    // Mark interview as completed if feedback submitted
    await this.prisma.interview.update({
      where: { id: dto.interviewId },
      data: { status: 'COMPLETED' },
    });

    await this.auditService.log({
      actorId: interviewerId,
      action: AuditActionType.FEEDBACK_SUBMITTED,
      entityType: 'InterviewFeedback',
      entityId: feedback.id,
      afterSnapshot: {
        interviewId: dto.interviewId,
        overallRating: dto.overallRating,
        recommendation: dto.recommendation,
      },
    });

    return feedback;
  }

  async getInterviewFeedback(interviewId: string) {
    return this.prisma.interviewFeedback.findMany({
      where: { interviewId },
      include: {
        interviewer: {
          select: { id: true, fullName: true, email: true, designation: true },
        },
      },
    });
  }
}
