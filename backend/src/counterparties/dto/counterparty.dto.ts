import { CounterpartyType } from '@generated/prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCounterpartyDto {
  @ApiProperty({ example: 'Берег НН' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ enum: CounterpartyType })
  @IsOptional()
  @IsEnum(CounterpartyType)
  type?: CounterpartyType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalEntity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCounterpartyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ enum: CounterpartyType })
  @IsOptional()
  @IsEnum(CounterpartyType)
  type?: CounterpartyType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalEntity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CounterpartyQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CounterpartyType)
  type?: CounterpartyType;
}

export class CreateOfferDto {
  @IsString()
  counterpartyId!: string;

  @IsString()
  materialId!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @IsOptional()
  @IsString()
  supplyStatus?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateOfferDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @IsOptional()
  @IsString()
  supplyStatus?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class OfferQueryDto {
  @IsOptional()
  @IsString()
  counterpartyId?: string;

  @IsOptional()
  @IsString()
  materialId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
