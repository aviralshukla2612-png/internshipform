import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    let retries = 10;
    while (retries > 0) {
      try {
        await this.$connect();
        this.logger.log('Prisma connected to PostgreSQL database successfully.');
        return;
      } catch (err: any) {
        retries--;
        this.logger.warn(
          `PostgreSQL connection pending (${retries} attempts left): ${err.message}. Retrying in 2 seconds...`,
        );
        if (retries === 0) {
          this.logger.error('Database connection failed after 10 attempts. Keeping app alive for health checks.');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
