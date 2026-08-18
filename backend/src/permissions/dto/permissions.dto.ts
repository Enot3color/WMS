import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@generated/prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PermissionFlagsDto {
  @ApiProperty()
  @IsBoolean()
  canRead: boolean;

  @ApiProperty()
  @IsBoolean()
  canCreate: boolean;

  @ApiProperty()
  @IsBoolean()
  canUpdate: boolean;

  @ApiProperty()
  @IsBoolean()
  canDelete: boolean;
}

export class RoleScreenPermissionDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty()
  @IsString()
  screenCode: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PermissionFlagsDto)
  permissions: PermissionFlagsDto;
}

export class UpdatePermissionsMatrixDto {
  @ApiProperty({ type: [RoleScreenPermissionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleScreenPermissionDto)
  items: RoleScreenPermissionDto[];
}
