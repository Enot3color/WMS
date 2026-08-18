import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMaterialDto,
  MaterialQueryDto,
  UpdateMaterialDto,
} from './dto/material.dto';

const materialInclude = {
  category: true,
  unit: true,
  stockBalance: true,
  offers: {
    include: { counterparty: true },
    orderBy: [{ isPrimary: 'desc' as const }, { price: 'asc' as const }],
  },
} satisfies Prisma.MaterialInclude;

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: MaterialQueryDto) {
    const where: Prisma.MaterialWhereInput = { isActive: true };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { series: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.material.findMany({
      where,
      include: materialInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: materialInclude,
    });

    if (!material) {
      throw new NotFoundException('Материал не найден');
    }

    return material;
  }

  async create(dto: CreateMaterialDto) {
    const material = await this.prisma.material.create({
      data: {
        name: dto.name.trim(),
        categoryId: dto.categoryId,
        unitId: dto.unitId,
        series: dto.series?.trim(),
        color: dto.color?.trim(),
        densityGsm: dto.densityGsm,
        thicknessMicron: dto.thicknessMicron,
        texture: dto.texture?.trim(),
        coating: dto.coating?.trim(),
        dimensions: dto.dimensions?.trim(),
        description: dto.description?.trim(),
        minStock: dto.minStock,
        purchaseBatch: dto.purchaseBatch,
        isActive: dto.isActive ?? true,
      },
      include: materialInclude,
    });

    await this.prisma.stockBalance.create({
      data: { materialId: material.id },
    });

    return material;
  }

  async update(id: string, dto: UpdateMaterialDto) {
    await this.findOne(id);

    return this.prisma.material.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        categoryId: dto.categoryId,
        unitId: dto.unitId,
        series: dto.series?.trim(),
        color: dto.color?.trim(),
        densityGsm: dto.densityGsm,
        thicknessMicron: dto.thicknessMicron,
        texture: dto.texture?.trim(),
        coating: dto.coating?.trim(),
        dimensions: dto.dimensions?.trim(),
        description: dto.description?.trim(),
        minStock: dto.minStock,
        purchaseBatch: dto.purchaseBatch,
        isActive: dto.isActive,
      },
      include: materialInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const [movementLines, requestLines] = await Promise.all([
      this.prisma.movementLine.count({ where: { materialId: id } }),
      this.prisma.managerRequestLine.count({ where: { materialId: id } }),
    ]);

    if (movementLines > 0 || requestLines > 0) {
      throw new BadRequestException('Нельзя удалить материал с историей движений или заказов');
    }

    await this.prisma.material.delete({ where: { id } });
    return { success: true };
  }

  async findStockPositions() {
    const materials = await this.prisma.material.findMany({
      where: {
        isActive: true,
        minStock: { not: null },
      },
      include: materialInclude,
      orderBy: { name: 'asc' },
    });

    return materials.map((material) => {
      const available = Number(material.stockBalance?.available ?? 0);
      const min = Number(material.minStock ?? 0);
      return {
        ...material,
        isBelowMin: available < min,
      };
    });
  }
}
