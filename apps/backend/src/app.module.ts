import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { EmailModule } from './modules/email/email.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120, // 120 requests per minute
      },
    ]),
    PrismaModule,
    AuditModule,
    AuthModule,
    JobsModule,
    DocumentsModule,
    ApplicationsModule,
    InterviewsModule,
    FeedbackModule,
    WhatsAppModule,
    EmailModule,
    ReportsModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
