import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { AuditActionType, UserRoleType } from '@recruitment/shared';
import { UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(
    loginDto: LoginDto,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const { email, password } = loginDto;
    const user = await this.prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      await this.auditService.log({
        action: AuditActionType.LOGIN_FAILED,
        entityType: 'AdminUser',
        entityId: 'UNKNOWN',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        beforeSnapshot: { attemptedEmail: email },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account temporarily locked due to repeated failed attempts. Please retry in ${remainingMinutes} minute(s).`,
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account has been suspended or deactivated');
    }

    // Verify Password with Argon2id
    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (!isPasswordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= 5;
      const lockoutUntil = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await this.prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : attempts,
          lockoutUntil,
        },
      });

      await this.auditService.log({
        actorId: user.id,
        action: AuditActionType.LOGIN_FAILED,
        entityType: 'AdminUser',
        entityId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      if (shouldLock) {
        throw new UnauthorizedException(
          'Maximum failed login attempts exceeded. Account locked for 15 minutes.',
        );
      }

      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset failed login counter on success
    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Create session in database
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        expiresAt,
      },
    });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.action),
        ),
      ),
    );

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
      sessionToken,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.auditService.log({
      actorId: user.id,
      action: AuditActionType.LOGIN_SUCCESS,
      entityType: 'AdminUser',
      entityId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      accessToken,
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        department: user.department,
        designation: user.designation,
        roles,
        permissions,
      },
    };
  }

  async logout(userId: string, sessionToken?: string) {
    if (sessionToken) {
      await this.prisma.userSession.updateMany({
        where: { userId, sessionToken },
        data: { isRevoked: true },
      });
    }

    await this.auditService.log({
      actorId: userId,
      action: AuditActionType.LOGOUT,
      entityType: 'AdminUser',
      entityId: userId,
    });

    return { success: true, message: 'Logged out successfully' };
  }

  async createAdminUser(
    dto: {
      email: string;
      fullName: string;
      password: string;
      role: UserRoleType;
      department?: string;
      designation?: string;
    },
    creatorId: string,
  ) {
    const existing = await this.prisma.adminUser.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 4,
    });

    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: dto.role },
    });

    const newUser = await this.prisma.adminUser.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        fullName: dto.fullName,
        passwordHash,
        department: dto.department,
        designation: dto.designation,
        userRoles: {
          create: {
            roleId: role.id,
          },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        department: true,
        designation: true,
        createdAt: true,
      },
    });

    await this.auditService.log({
      actorId: creatorId,
      action: AuditActionType.ADMIN_USER_CREATED,
      entityType: 'AdminUser',
      entityId: newUser.id,
      afterSnapshot: { email: newUser.email, role: dto.role },
    });

    return newUser;
  }

  async listAdminUsers() {
    return this.prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        department: true,
        designation: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
