import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CandidateApplicationSubmissionDto,
  ApplicationStatus,
  AuditActionType,
  Gender,
  AddressType,
  DocumentType,
} from '@recruitment/shared';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private generateApplicationCode(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `APP-${yyyy}${mm}${dd}-${rand}`;
  }

  async submitApplication(dto: CandidateApplicationSubmissionDto, meta: { ip?: string; ua?: string }) {
    // 1. Mandatory Gender Check
    if (!dto.gender || !Object.values(Gender).includes(dto.gender)) {
      throw new BadRequestException('Gender is compulsory and must be one of the specified choices.');
    }

    // 1b. Strict 10-Digit Mobile & WhatsApp Validation
    const rawMobile = dto.mobileNumber || dto.whatsappNumber || '';
    const rawWhatsapp = dto.whatsappNumber || dto.mobileNumber || '';
    const cleanMobile = rawMobile.replace(/\D/g, '').slice(0, 10);
    const cleanWhatsapp = rawWhatsapp.replace(/\D/g, '').slice(0, 10);
    if (cleanMobile.length !== 10) {
      throw new BadRequestException('Contact / WhatsApp Number must be exactly 10 numeric digits.');
    }
    if (cleanWhatsapp.length !== 10) {
      throw new BadRequestException('WhatsApp Number must be exactly 10 numeric digits.');
    }

    // 2. Resolve Job Position (Internship position by default)
    let job = null;
    if (dto.jobId) {
      job = await this.prisma.jobPosition.findFirst({
        where: {
          OR: [{ id: dto.jobId }, { slug: dto.jobId }],
          status: 'PUBLISHED',
        },
      });
    }

    if (!job) {
      job = await this.prisma.jobPosition.findFirst({
        where: {
          slug: 'internship-program',
          status: 'PUBLISHED',
        },
      });
    }

    if (!job) {
      job = await this.prisma.jobPosition.findFirst({
        where: { status: 'PUBLISHED' },
      });
    }

    if (!job) {
      job = await this.prisma.jobPosition.create({
        data: {
          title: 'Full-Stack & AI Engineering Internship Program',
          slug: 'internship-program',
          department: 'Engineering & Innovation',
          jobDescription: 'Comprehensive industry internship covering AI/ML integration, MERN/MEAN full-stack development, database architecture, and production engineering.',
          requiredQualification: 'Pursuing or Completed Degree (B.Tech / B.E / BCA / MCA / B.Sc / Any Degree)',
          requiredSkills: ['AI / ML', 'MERN Stack', 'MEAN Stack', 'PostgreSQL', 'Database Logic', 'Docker'],
          openingsCount: 50,
          jobLocation: 'Hybrid / Remote / Office',
          employmentType: 'INTERNSHIP' as any,
          status: 'PUBLISHED',
        },
      });
    }

    // 3. Duplicate Prevention Check (Same email or mobile for the same position)
    const existingApplication = await this.prisma.jobApplication.findFirst({
      where: {
        jobPositionId: job.id,
        candidate: {
          OR: [
            { email: dto.email.toLowerCase().trim() },
            { mobileNumber: cleanMobile },
          ],
        },
      },
      include: {
        candidate: true,
      },
    });

    if (existingApplication) {
      throw new BadRequestException(
        `An application for this program has already been submitted under email ${dto.email} or mobile ${cleanMobile} (Application ID: ${existingApplication.applicationCode}).`,
      );
    }

    // 4. Validate Education Entries (Obtained <= Total marks)
    if (!dto.education || dto.education.length === 0) {
      throw new BadRequestException('At least one educational qualification is required.');
    }

    for (const edu of dto.education) {
      if (edu.totalMarks !== undefined && edu.obtainedMarks !== undefined) {
        if (edu.obtainedMarks > edu.totalMarks) {
          throw new BadRequestException(
            `Obtained marks (${edu.obtainedMarks}) cannot exceed total marks (${edu.totalMarks}) for ${edu.degreeName}.`,
          );
        }
      }
    }

    // 5. Validate Work Experience (if experienced)
    if (!dto.isFresher && dto.experiences && dto.experiences.length > 0) {
      for (const exp of dto.experiences) {
        const join = new Date(exp.joiningDate);
        if (isNaN(join.getTime())) {
          throw new BadRequestException(`Invalid joining date for company ${exp.companyName}.`);
        }
        if (!exp.currentlyWorking && exp.leavingDate) {
          const leave = new Date(exp.leavingDate);
          if (leave < join) {
            throw new BadRequestException(
              `Leaving date cannot be earlier than joining date for company ${exp.companyName}.`,
            );
          }
        }
      }
    }

    // 6. Generate unique application code
    const applicationCode = this.generateApplicationCode();

    // 7. Atomic Database Transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Find or create candidate profile
      let candidate = await tx.candidate.findFirst({
        where: {
          OR: [
            { email: dto.email.toLowerCase().trim() },
            { mobileNumber: cleanMobile },
          ],
        },
      });

      if (!candidate) {
        candidate = await tx.candidate.create({
          data: {
            applicationCode,
            fullName: dto.fullName.trim(),
            fatherName: (dto.fatherName || 'N/A').trim(),
            motherName: (dto.motherName || 'N/A').trim(),
            dateOfBirth: new Date(dto.dateOfBirth),
            gender: dto.gender as any,
            mobileNumber: cleanMobile,
            whatsappNumber: cleanWhatsapp,
            email: dto.email.toLowerCase().trim(),
            profilePhotoDocId: dto.profilePhotoDocId,
          },
        });
      } else {
        // Update basic contact info
        candidate = await tx.candidate.update({
          where: { id: candidate.id },
          data: {
            fullName: dto.fullName.trim(),
            fatherName: (dto.fatherName || 'N/A').trim(),
            motherName: (dto.motherName || 'N/A').trim(),
            dateOfBirth: new Date(dto.dateOfBirth),
            gender: dto.gender as any,
            mobileNumber: cleanMobile,
            whatsappNumber: cleanWhatsapp,
            profilePhotoDocId: dto.profilePhotoDocId || candidate.profilePhotoDocId,
          },
        });
      }

      // Candidate Addresses (Fallback gracefully if omitted from client form)
      const currentStreet = dto.currentAddress?.street?.trim() || 'Not Provided';
      const currentCity = dto.currentAddress?.city?.trim() || 'Not Provided';
      const currentState = dto.currentAddress?.state?.trim() || 'Not Provided';
      const currentPin = dto.currentAddress?.pinCode?.trim() || '000000';

      await tx.candidateAddress.create({
        data: {
          candidateId: candidate.id,
          type: AddressType.CURRENT as any,
          street: currentStreet,
          city: currentCity,
          state: currentState,
          pinCode: currentPin,
        },
      });

      const permStreet = dto.isSameAddress ? currentStreet : (dto.permanentAddress?.street?.trim() || currentStreet);
      const permCity = dto.isSameAddress ? currentCity : (dto.permanentAddress?.city?.trim() || currentCity);
      const permState = dto.isSameAddress ? currentState : (dto.permanentAddress?.state?.trim() || currentState);
      const permPin = dto.isSameAddress ? currentPin : (dto.permanentAddress?.pinCode?.trim() || currentPin);

      await tx.candidateAddress.create({
        data: {
          candidateId: candidate.id,
          type: AddressType.PERMANENT as any,
          street: permStreet,
          city: permCity,
          state: permState,
          pinCode: permPin,
        },
      });

      // Educations
      for (const edu of dto.education) {
        let calcPercentage = edu.percentage;
        if (!calcPercentage && edu.totalMarks && edu.obtainedMarks && edu.totalMarks > 0) {
          calcPercentage = Number(((edu.obtainedMarks / edu.totalMarks) * 100).toFixed(2));
        }

        await tx.education.create({
          data: {
            candidateId: candidate.id,
            qualificationType: edu.qualificationType as any,
            degreeName: edu.degreeName,
            institutionName: edu.institutionName,
            universityOrBoard: edu.universityOrBoard,
            specialization: edu.specialization,
            passingYear: edu.passingYear,
            totalMarks: edu.totalMarks,
            obtainedMarks: edu.obtainedMarks,
            percentage: calcPercentage,
            cgpa: edu.cgpa,
            gradingSystem: edu.gradingSystem as any,
            marksheetDocId: edu.marksheetDocId,
          },
        });
      }

      // Work Experiences
      if (!dto.isFresher && dto.experiences) {
        for (const exp of dto.experiences) {
          await tx.workExperience.create({
            data: {
              candidateId: candidate.id,
              companyName: exp.companyName,
              companyAddress: exp.companyAddress,
              companyWebsite: exp.companyWebsite,
              designation: exp.designation,
              department: exp.department,
              employmentType: exp.employmentType as any,
              joiningDate: new Date(exp.joiningDate),
              leavingDate: exp.currentlyWorking ? null : exp.leavingDate ? new Date(exp.leavingDate) : null,
              currentlyWorking: exp.currentlyWorking,
              totalExperienceMonths: exp.totalExperienceMonths,
              lastDrawnSalary: exp.lastDrawnSalary,
              expectedSalary: exp.expectedSalary,
              reasonForLeaving: exp.reasonForLeaving,
              jobResponsibilities: exp.jobResponsibilities,
              hrContactInfo: exp.hrContactInfo,
              experienceCertDocId: exp.experienceCertDocId,
            },
          });
        }
      }

      // Skills (Defaults populated if skill wizard step skipped)
      const techSkills = Array.isArray(dto.technicalSkills) && dto.technicalSkills.length > 0
        ? dto.technicalSkills
        : ['AI/ML Logic', 'MERN & MEAN Stack', 'PostgreSQL', 'Database Systems'];
      const profSkills = Array.isArray(dto.professionalSkills) && dto.professionalSkills.length > 0
        ? dto.professionalSkills
        : ['Problem Solving', 'Analytical Logic', 'Teamwork'];

      for (const skill of techSkills) {
        await tx.candidateSkill.create({
          data: { candidateId: candidate.id, skillName: skill, isTechnical: true },
        });
      }
      for (const skill of profSkills) {
        await tx.candidateSkill.create({
          data: { candidateId: candidate.id, skillName: skill, isTechnical: false },
        });
      }

      // Consent record
      await tx.consentRecord.create({
        data: {
          candidateId: candidate.id,
          accuracyConfirmed: dto.accuracyConfirmed,
          recruitmentProcessingConsent: dto.recruitmentProcessingConsent,
          privacyPolicyAcknowledged: dto.privacyPolicyAcknowledged,
          whatsappConsent: dto.whatsappConsent, // Explicit opt-in captured separately
          ipAddress: meta.ip,
          userAgent: meta.ua,
        },
      });

      // Create JobApplication
      const application = await tx.jobApplication.create({
        data: {
          applicationCode,
          candidateId: candidate.id,
          jobPositionId: job.id,
          status: ApplicationStatus.NEW as any,
          isFresher: dto.isFresher,
          noticePeriodDays: dto.noticePeriodDays,
          currentEmploymentStatus: dto.currentEmploymentStatus,
          preferredLocation: dto.preferredJobLocation,
          expectedSalary: dto.expectedSalary,
          availabilityDate: dto.availabilityToJoinDate ? new Date(dto.availabilityToJoinDate) : null,
          additionalInformation: dto.additionalInformation,
          resumeDocId: dto.resumeDocId,
        },
      });

      // Initial Status History
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          previousStatus: ApplicationStatus.NEW as any,
          newStatus: ApplicationStatus.NEW as any,
          reason: 'Application submitted successfully by candidate',
        },
      });

      return {
        applicationId: application.id,
        applicationCode: application.applicationCode,
        candidateName: candidate.fullName,
        jobTitle: job.title,
      };
    });

    await this.auditService.log({
      action: 'APPLICATION_SUBMITTED',
      entityType: 'JobApplication',
      entityId: result.applicationId,
      ipAddress: meta.ip,
      userAgent: meta.ua,
      afterSnapshot: {
        applicationCode: result.applicationCode,
        candidateName: result.candidateName,
        jobTitle: result.jobTitle,
      },
    });

    return result;
  }

  async trackApplication(code: string, emailOrMobile: string) {
    const trimmedInput = emailOrMobile.toLowerCase().trim();
    const app = await this.prisma.jobApplication.findFirst({
      where: {
        applicationCode: code.toUpperCase().trim(),
        candidate: {
          OR: [
            { email: trimmedInput },
            { mobileNumber: trimmedInput },
          ],
        },
      },
      include: {
        candidate: {
          select: {
            fullName: true,
            email: true,
            mobileNumber: true,
          },
        },
        jobPosition: {
          select: {
            title: true,
            department: true,
            jobLocation: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          select: {
            newStatus: true,
            createdAt: true,
            reason: true,
          },
        },
        interviews: {
          orderBy: { scheduledStart: 'desc' },
          select: {
            roundType: true,
            interviewMode: true,
            scheduledStart: true,
            durationMinutes: true,
            meetingDetails: true,
            status: true,
          },
        },
      },
    });

    if (!app) {
      throw new NotFoundException('No matching application found for provided Application ID and contact.');
    }

    return {
      applicationCode: app.applicationCode,
      candidateName: app.candidate.fullName,
      jobTitle: app.jobPosition.title,
      department: app.jobPosition.department,
      appliedDate: app.createdAt,
      currentStatus: app.status,
      statusHistory: app.statusHistory,
      interviews: app.interviews,
    };
  }

  async findAllApplications(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ApplicationStatus;
    jobId?: string;
    gender?: Gender;
    isFresher?: boolean;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.jobId) where.jobPositionId = query.jobId;
    if (query.isFresher !== undefined) where.isFresher = query.isFresher;

    if (query.gender) {
      where.candidate = { ...where.candidate, gender: query.gender };
    }

    if (query.search) {
      where.OR = [
        { applicationCode: { contains: query.search, mode: 'insensitive' } },
        { candidate: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { candidate: { email: { contains: query.search, mode: 'insensitive' } } },
        { candidate: { mobileNumber: { contains: query.search } } },
      ];
    }

    const orderBy: any = {};
    const sortField = query.sortField || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    orderBy[sortField] = sortOrder;

    const [total, data] = await Promise.all([
      this.prisma.jobApplication.count({ where }),
      this.prisma.jobApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          candidate: {
            include: {
              educations: { take: 1, orderBy: { passingYear: 'desc' } },
              experiences: { take: 1, orderBy: { joiningDate: 'desc' } },
            },
          },
          jobPosition: {
            select: { title: true, department: true },
          },
          interviews: {
            select: { id: true, status: true, roundType: true },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getApplicationDetail(id: string) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            addresses: true,
            educations: { orderBy: { passingYear: 'desc' } },
            experiences: { orderBy: { joiningDate: 'desc' } },
            skills: true,
            certifications: true,
            documents: true,
            consents: true,
          },
        },
        jobPosition: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: { changedBy: { select: { fullName: true, email: true } } },
        },
        interviews: {
          orderBy: { scheduledStart: 'desc' },
          include: {
            assignments: {
              include: {
                interviewer: { select: { id: true, fullName: true, email: true } },
                feedback: true,
              },
            },
            feedbacks: true,
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { fullName: true, email: true } } },
        },
        whatsAppMessages: {
          orderBy: { createdAt: 'desc' },
        },
        emailLogs: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!app) {
      throw new NotFoundException('Job application not found');
    }

    return app;
  }

  async updateStatus(
    id: string,
    newStatus: ApplicationStatus,
    reason: string,
    changedById: string,
  ) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!app) {
      throw new NotFoundException('Application not found');
    }

    const previousStatus = app.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedApp = await tx.jobApplication.update({
        where: { id },
        data: { status: newStatus as any },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          previousStatus: previousStatus as any,
          newStatus: newStatus as any,
          changedById,
          reason,
        },
      });

      return updatedApp;
    });

    await this.auditService.log({
      actorId: changedById,
      action: AuditActionType.APPLICATION_STATUS_CHANGED,
      entityType: 'JobApplication',
      entityId: id,
      beforeSnapshot: { status: previousStatus },
      afterSnapshot: { status: newStatus, reason },
    });

    return updated;
  }

  async addNote(applicationId: string, authorId: string, note: string) {
    return this.prisma.candidateNote.create({
      data: {
        applicationId,
        authorId,
        note,
      },
      include: {
        author: { select: { fullName: true, email: true } },
      },
    });
  }
}
