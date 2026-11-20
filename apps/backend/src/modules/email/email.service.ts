import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActionType } from '@recruitment/shared';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null = null;
  private readonly fromEmail = process.env.EMAIL_FROM || 'recruitment@enterprise.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  async sendApplicationConfirmation(applicationId: string) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        jobPosition: true,
      },
    });

    if (!app) return;

    const subject = `Application Received: ${app.jobPosition.title} - [${app.applicationCode}]`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
        <h2 style="color: #1e3a8a;">Application Received Successfully</h2>
        <p>Dear ${app.candidate.fullName},</p>
        <p>Thank you for applying for the position of <strong>${app.jobPosition.title}</strong> at our company.</p>
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Application Reference ID:</strong> ${app.applicationCode}</p>
          <p style="margin: 4px 0 0 0;"><strong>Position:</strong> ${app.jobPosition.title} (${app.jobPosition.department})</p>
        </div>
        <p>You can track the progress of your application using your Application ID on our candidate portal.</p>
        <p>Our recruitment team is currently reviewing your profile and will update you regarding the next steps.</p>
        <br/>
        <p>Best regards,<br/><strong>HR Recruitment Team</strong></p>
      </div>
    `;

    return this.dispatchEmail(applicationId, app.candidate.email, subject, 'application_confirmation', html);
  }

  private async dispatchEmail(
    applicationId: string,
    recipient: string,
    subject: string,
    templateName: string,
    html: string,
  ) {
    let status = 'SENT';
    let errorMessage = null;
    let messageId = null;

    if (this.resend) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: this.fromEmail,
          to: recipient,
          subject,
          html,
        });

        if (error) {
          status = 'FAILED';
          errorMessage = error.message;
        } else {
          messageId = data?.id;
        }
      } catch (err: any) {
        status = 'FAILED';
        errorMessage = err.message;
      }
    } else {
      this.logger.log(`[DEV MODE] Email simulated for ${recipient}: ${subject}`);
    }

    const log = await this.prisma.emailLog.create({
      data: {
        applicationId,
        recipient,
        subject,
        templateName,
        messageId,
        status,
        errorMessage,
      },
    });

    await this.auditService.log({
      action: AuditActionType.EMAIL_SENT,
      entityType: 'EmailLog',
      entityId: log.id,
      afterSnapshot: { recipient, subject, status },
    });

    return log;
  }

  async getEmailLogs(applicationId?: string) {
    const where: any = {};
    if (applicationId) where.applicationId = applicationId;
    return this.prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }
}
