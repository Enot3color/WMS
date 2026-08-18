import { SupplierOrderStatus } from '@generated/prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SupplierOrderLineDto {
  @IsString()
  materialId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreateSupplierOrderDto {
  @IsString()
  counterpartyId!: string;

  @IsOptional()
  @IsString()
  managerRequestId?: string;

  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SupplierOrderLineDto)
  lines!: SupplierOrderLineDto[];
}

export class UpdateSupplierOrderDto {
  @IsOptional()
  @IsEnum(SupplierOrderStatus)
  status?: SupplierOrderStatus;

  @IsOptional()
  @IsString()
  counterpartyId?: string;

  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierOrderLineDto)
  lines?: SupplierOrderLineDto[];
}

export class SupplierOrderQueryDto {
  @IsOptional()
  @IsEnum(SupplierOrderStatus)
  status?: SupplierOrderStatus;

  @IsOptional()
  @IsString()
  managerRequestId?: string;
}
