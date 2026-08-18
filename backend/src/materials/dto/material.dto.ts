import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  categoryId!: string;

  @IsString()
  unitId!: string;

  @IsOptional()
  @IsString()
  series?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  densityGsm?: number;

  @IsOptional()
  @IsInt()
  thicknessMicron?: number;

  @IsOptional()
  @IsString()
  texture?: string;

  @IsOptional()
  @IsString()
  coating?: string;

  @IsOptional()
  @IsString()
  dimensions?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  minStock?: number;

  @IsOptional()
  @IsNumber()
  purchaseBatch?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  series?: string | null;

  @IsOptional()
  @IsString()
  color?: string | null;

  @IsOptional()
  @IsInt()
  densityGsm?: number | null;

  @IsOptional()
  @IsInt()
  thicknessMicron?: number | null;

  @IsOptional()
  @IsString()
  texture?: string | null;

  @IsOptional()
  @IsString()
  coating?: string | null;

  @IsOptional()
  @IsString()
  dimensions?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsNumber()
  minStock?: number | null;

  @IsOptional()
  @IsNumber()
  purchaseBatch?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MaterialQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
