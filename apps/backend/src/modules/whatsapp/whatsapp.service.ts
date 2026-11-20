import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  WhatsAppMessageType,
  WhatsAppDeliveryStatus,
  AuditActionType,
} from '@recruitment/shared';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  private readonly phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID || '';
  private readonly accessToken = process.env.META_WA_ACCESS_TOKEN || '';
  private readonly apiVersion = process.env.META_WA_API_VERSION || 'v18.0';
  private readonly verifyToken = process.env.META_WA_WEBHOOK_VERIFY_TOKEN || 'recruitment_wa_verify_token';
  private readonly appSecret = process.env.META_WA_APP_SECRET || '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Verify Meta Webhook Challenge (GET)
   */
  verifyWebhook(mode: string, token: string, challenge: string): string {
    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('Meta WhatsApp Webhook subscription verified successfully');
      return challenge;
    }
    throw new UnauthorizedException('Invalid Meta webhook verification token');
  }

  /**
   * Validate Meta X-Hub-Signature-256 (HMAC SHA-256)
   */
  validateSignature(rawBody: string | Buffer, signatureHeader?: string): boolean {
    if (!this.appSecret || !signatureHeader) {
      // In development or if not configured, log warning
      return true;
    }

    const [algo, signature] = signatureHeader.split('=');
    if (algo !== 'sha256' || !signature) {
      return false;
    }

    const expected = crypto
      .createHmac('sha256', this.appSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  }

  /**
   * Send WhatsApp Template Notification via Official Meta Cloud API
   */
  async sendInterviewInvitation(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            candidate: {
              include: { consents: { orderBy: { consentedAt: 'desc' }, take: 1 } },
            },
            jobPosition: true,
          },
        },
        assignments: {
          include: { interviewer: true },
        },
      },
    });

    if (!interview) {
      throw new BadRequestException('Interview not found');
    }

    const candidate = interview.application.candidate;
    const consent = candidate.consents[0];

    // STRICT CONSENT CHECK: Do not dispatch if candidate has not granted explicit WhatsApp consent
    if (!consent || !consent.whatsappConsent) {
      this.logger.warn(
        `Cannot send WhatsApp notification to candidate ${candidate.fullName}: Candidate did not opt-in for WhatsApp communication.`,
      );
      return { skipped: true, reason: 'Candidate has not granted explicit WhatsApp consent' };
    }

    const companySetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'COMPANY_NAME' },
    });
    const companyName = companySetting?.value || 'Enterprise Corp';
    const interviewerName = interview.assignments[0]?.interviewer?.fullName || 'HR Interview Panel';

    const interviewDate = interview.scheduledStart.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const interviewTime = interview.scheduledStart.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Create tracking record in DB
    const templateName = 'interview_invitation_official';
    const messageRecord = await this.prisma.whatsAppMessage.create({
      data: {
        applicationId: interview.applicationId,
        recipientNumber: candidate.whatsappNumber,
        candidateName: candidate.fullName,
        messageType: WhatsAppMessageType.INTERVIEW_INVITATION as any,
        templateName,
        payloadJson: JSON.stringify({
          candidate_name: candidate.fullName,
          company_name: companyName,
          job_title: interview.application.jobPosition.title,
          interview_date: interviewDate,
          interview_time: interviewTime,
          interview_mode: interview.interviewMode,
          interviewer_name: interviewerName,
          meeting_details: interview.meetingDetails,
        }),
        deliveryStatus: WhatsAppDeliveryStatus.QUEUED as any,
        scheduledAt: new Date(),
      },
    });

    // Dispatch via Meta Graph API if credentials are configured
    if (this.phoneNumberId && this.accessToken) {
      try {
        const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
        const response = await axios.post(
          url,
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: candidate.whatsappNumber.replace(/[^0-9]/g, ''),
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'en' },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: candidate.fullName },
                    { type: 'text', text: companyName },
                    { type: 'text', text: interview.application.jobPosition.title },
                    { type: 'text', text: interviewDate },
                    { type: 'text', text: interviewTime },
                    { type: 'text', text: interview.interviewMode },
                    { type: 'text', text: interviewerName },
                    { type: 'text', text: interview.meetingDetails },
                    { type: 'text', text: companyName },
                  ],
                },
              ],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          },
        );

        const metaMessageId = response.data?.messages?.[0]?.id;

        await this.prisma.whatsAppMessage.update({
          where: { id: messageRecord.id },
          data: {
            metaMessageId,
            deliveryStatus: WhatsAppDeliveryStatus.SENT as any,
            sentAt: new Date(),
          },
        });

        await this.auditService.log({
          action: AuditActionType.WHATSAPP_SENT,
          entityType: 'WhatsAppMessage',
          entityId: messageRecord.id,
          afterSnapshot: { metaMessageId, recipient: candidate.whatsappNumber },
        });

        return { success: true, messageId: messageRecord.id, metaMessageId };
      } catch (err: any) {
        const errorMsg = err.response?.data?.error?.message || err.message;
        this.logger.error(`Meta Cloud API dispatch failed: ${errorMsg}`);

        await this.prisma.whatsAppMessage.update({
          where: { id: messageRecord.id },
          data: {
            deliveryStatus: WhatsAppDeliveryStatus.FAILED as any,
            failureReason: errorMsg,
          },
        });

        return { success: false, error: errorMsg, messageId: messageRecord.id };
      }
    } else {
      this.logger.log(`Meta WhatsApp credentials not set. Message queued locally with ID: ${messageRecord.id}`);
      return { success: true, queuedLocally: true, messageId: messageRecord.id };
    }
  }

  /**
   * Handle Webhook Delivery Updates from Meta
   */
  async handleWebhookPayload(payload: any) {
    if (!payload?.entry) return;

    for (const entry of payload.entry) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          const value = change.value;
          const statuses = value.statuses || [];

          for (const status of statuses) {
            const metaMessageId = status.id;
            const statusString = status.status; // "sent", "delivered", "read", "failed"
            const timestamp = status.timestamp ? new Date(Number(status.timestamp) * 1000) : new Date();

            let mappedStatus: WhatsAppDeliveryStatus = WhatsAppDeliveryStatus.SENT;
            if (statusString === 'delivered') mappedStatus = WhatsAppDeliveryStatus.DELIVERED;
            if (statusString === 'read') mappedStatus = WhatsAppDeliveryStatus.READ;
            if (statusString === 'failed') mappedStatus = WhatsAppDeliveryStatus.FAILED;

            const updateData: any = { deliveryStatus: mappedStatus as any };
            if (mappedStatus === WhatsAppDeliveryStatus.DELIVERED) updateData.deliveredAt = timestamp;
            if (mappedStatus === WhatsAppDeliveryStatus.READ) updateData.readAt = timestamp;
            if (mappedStatus === WhatsAppDeliveryStatus.FAILED) {
              updateData.failureReason = status.errors?.[0]?.message || 'Delivery failure reported by Meta';
            }

            const existingMsg = await this.prisma.whatsAppMessage.findUnique({
              where: { metaMessageId },
            });

            if (existingMsg) {
              await this.prisma.whatsAppMessage.update({
                where: { id: existingMsg.id },
                data: updateData,
              });

              await this.prisma.whatsAppWebhookEvent.create({
                data: {
                  whatsappMessageId: existingMsg.id,
                  metaMessageId,
                  eventType: statusString,
                  rawPayload: JSON.stringify(status),
                },
              });
            }
          }
        }
      }
    }
  }

  async getMessages(query: { page?: number; limit?: number; status?: WhatsAppDeliveryStatus }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.deliveryStatus = query.status;

    const [total, data] = await Promise.all([
      this.prisma.whatsAppMessage.count({ where }),
      this.prisma.whatsAppMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          application: {
            select: {
              applicationCode: true,
              jobPosition: { select: { title: true } },
            },
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
}
