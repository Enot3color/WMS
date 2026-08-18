import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  CreateStatusReferenceDto,
  CreateUnitDto,
  UpdateCategoryDto,
  UpdateStatusReferenceDto,
  UpdateUnitDto,
} from './dto/reference.dto';

@Injectable()
export class ReferencesService {
  constructor(private readonly prisma: PrismaService) {}

  findCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: { name: dto.name.trim() } });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    await this.ensureCategory(id);
    return this.prisma.category.update({
      where: { id },
      data: { name: dto.name?.trim() },
    });
  }

  async deleteCategory(id: string) {
    await this.ensureCategory(id);
    const materialsCount = await this.prisma.material.count({ where: { categoryId: id } });
    if (materialsCount > 0) {
      throw new BadRequestException('Нельзя удалить категорию, используемую в номенклатуре');
    }
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  findUnits() {
    return this.prisma.unit.findMany({ orderBy: { name: 'asc' } });
  }

  createUnit(dto: CreateUnitDto) {
    return this.prisma.unit.create({
      data: {
        name: dto.name.trim(),
        shortName: dto.shortName.trim(),
      },
    });
  }

  async updateUnit(id: string, dto: UpdateUnitDto) {
    await this.ensureUnit(id);
    return this.prisma.unit.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        shortName: dto.shortName?.trim(),
      },
    });
  }

  async deleteUnit(id: string) {
    await this.ensureUnit(id);
    const materialsCount = await this.prisma.material.count({ where: { unitId: id } });
    if (materialsCount > 0) {
      throw new BadRequestException('Нельзя удалить единицу, используемую в номенклатуре');
    }
    await this.prisma.unit.delete({ where: { id } });
    return { success: true };
  }

  findStatusReferences(group?: string) {
    return this.prisma.statusReference.findMany({
      where: group ? { group } : undefined,
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  createStatusReference(dto: CreateStatusReferenceDto) {
    return this.prisma.statusReference.create({
      data: {
        group: dto.group,
        code: dto.code.trim().toUpperCase(),
        label: dto.label.trim(),
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateStatusReference(id: string, dto: UpdateStatusReferenceDto) {
    await this.ensureStatusReference(id);
    return this.prisma.statusReference.update({
      where: { id },
      data: dto,
    });
  }

  async deleteStatusReference(id: string) {
    await this.ensureStatusReference(id);
    await this.prisma.statusReference.delete({ where: { id } });
    return { success: true };
  }

  private async ensureCategory(id: string) {
    const item = await this.prisma.category.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Категория не найдена');
    return item;
  }

  private async ensureUnit(id: string) {
    const item = await this.prisma.unit.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Единица измерения не найдена');
    return item;
  }

  private async ensureStatusReference(id: string) {
    const item = await this.prisma.statusReference.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Статус не найден');
    return item;
  }
}
