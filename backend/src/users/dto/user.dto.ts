import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@generated/prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Иван' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Менеджеров' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: 'manager@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+7 900 123-45-67' })
  @IsString()
  @MinLength(10)
  phone: string;

  @ApiProperty({ example: 'ivan.manager' })
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Логин может содержать только латиницу, цифры, ".", "_" и "-"',
  })
  login: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MANAGER })
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(10)
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Логин может содержать только латиницу, цифры, ".", "_" и "-"',
  })
  login?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
