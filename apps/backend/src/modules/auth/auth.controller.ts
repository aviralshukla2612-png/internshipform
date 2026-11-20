import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RbacGuard } from './guards/rbac.guard';
import { Roles } from './decorators/rbac.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserRoleType } from '@recruitment/shared';

@ApiTags('Authentication & Admin Provisioning')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin / HR / Interviewer login with Argon2id verification' })
  @ApiResponse({ status: 200, description: 'Authentication successful, sets HTTP-only cookie' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await this.authService.login(loginDto, meta);

    // Set secure HTTP-only session cookie
    res.cookie('session_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke active session and clear authentication cookie' })
  async logout(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionToken = req.cookies?.['session_token'];
    const result = await this.authService.logout(userId, sessionToken);

    res.clearCookie('session_token', { path: '/' });
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile and permissions' })
  async getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRoleType.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Provision new admin or interviewer account (Super Admin only)' })
  async createAdminUser(
    @Body()
    dto: {
      email: string;
      fullName: string;
      password: string;
      role: UserRoleType;
      department?: string;
      designation?: string;
    },
    @CurrentUser('id') creatorId: string,
  ) {
    return this.authService.createAdminUser(dto, creatorId);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.HR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all system admin and interviewer accounts' })
  async listAdminUsers() {
    return this.authService.listAdminUsers();
  }
}
