import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { Permissions } from '../auth/decorators/rbac.decorator';
import { WhatsAppDeliveryStatus } from '@recruitment/shared';

@ApiTags('Meta WhatsApp Business Cloud API')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Get('webhook')
  @ApiOperation({ summary: 'Meta Webhook URL verification endpoint (hub.challenge)' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.whatsAppService.verifyWebhook(mode, token, challenge);
    res.status(HttpStatus.OK).send(result);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Meta Webhook delivery status ingestion with signature check' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: Request,
  ) {
    // Validate signature
    this.whatsAppService.validateSignature((req as any).rawBody || JSON.stringify(payload), signature);
    await this.whatsAppService.handleWebhookPayload(payload);
    return { status: 'EVENT_RECEIVED' };
  }

  @Post('send-interview-invite')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('whatsapp:send')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send interview invitation WhatsApp message to candidate' })
  async sendInvite(@Body('interviewId') interviewId: string) {
    return this.whatsAppService.sendInterviewInvitation(interviewId);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('whatsapp:logs:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'View WhatsApp dispatch & delivery history logs' })
  async getLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: WhatsAppDeliveryStatus,
  ) {
    return this.whatsAppService.getMessages({ page, limit, status });
  }
}
