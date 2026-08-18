import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Бумага' })
  @IsString()
  @MinLength(2)
  name: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}

export class CreateUnitDto {
  @ApiProperty({ example: 'Погонный метр' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'пог. м' })
  @IsString()
  @MinLength(1)
  shortName: string;
}

export class UpdateUnitDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  shortName?: string;
}

export class CreateStatusReferenceDto {
  @ApiProperty({ example: 'request_status' })
  @IsString()
  group: string;

  @ApiProperty({ example: 'SUBMITTED' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Новая' })
  @IsString()
  @MinLength(2)
  label: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateStatusReferenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
