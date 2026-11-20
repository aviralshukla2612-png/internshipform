import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@enterprise.com' })
  @IsEmail({}, { message: 'Must provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'AdminSecurePassword123!@#' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@enterprise.com' })
  @IsEmail({}, { message: 'Must provide a valid registered email address' })
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;
}
