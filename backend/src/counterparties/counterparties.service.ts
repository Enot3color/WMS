import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CounterpartyQueryDto,
  CreateCounterpartyDto,
  CreateOfferDto,
  OfferQueryDto,
  UpdateCounterpartyDto,
  UpdateOfferDto,
} from './dto/counterparty.dto';

const offerInclude = {
  counterparty: true,
  material: { include: { category: true, unit: true } },
} satisfies Prisma.CounterpartyOfferInclude;

@Injectable()
export class CounterpartiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: CounterpartyQueryDto) {
    const where: Prisma.CounterpartyWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legalEntity: { contains: search, mode: 'insensitive' } },
        { contactInfo: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.counterparty.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { offers: true } } },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.counterparty.findUnique({
      where: { id },
      include: {
        offers: {
          include: { material: { include: { category: true, unit: true } } },
          orderBy: { isPrimary: 'desc' },
        },
      },
    });
    if (!item) throw new NotFoundException('Контрагент не найден');
    return item;
  }

  create(dto: CreateCounterpartyDto) {
    return this.prisma.counterparty.create({
      data: {
        name: dto.name.trim(),
        type: dto.type,
        legalEntity: dto.legalEntity?.trim(),
        contactInfo: dto.contactInfo?.trim(),
        address: dto.address?.trim(),
        notes: dto.notes?.trim(),
      },
    });
  }

  async update(id: string, dto: UpdateCounterpartyDto) {
    await this.findOne(id);
    return this.prisma.counterparty.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        type: dto.type,
        legalEntity: dto.legalEntity?.trim(),
        contactInfo: dto.contactInfo?.trim(),
        address: dto.address?.trim(),
        notes: dto.notes?.trim(),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const orders = await this.prisma.supplierOrder.count({ where: { counterpartyId: id } });
    if (orders > 0) {
      throw new BadRequestException('Нельзя удалить контрагента с заказами');
    }
    await this.prisma.counterparty.delete({ where: { id } });
    return { success: true };
  }

  findOffers(query: OfferQueryDto) {
    const where: Prisma.CounterpartyOfferWhereInput = {};
    if (query.counterpartyId) where.counterpartyId = query.counterpartyId;
    if (query.materialId) where.materialId = query.materialId;
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { material: { name: { contains: search, mode: 'insensitive' } } },
        { counterparty: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.counterpartyOffer.findMany({
      where,
      include: offerInclude,
      orderBy: [{ isPrimary: 'desc' }, { counterparty: { name: 'asc' } }],
    });
  }

  findOffersByMaterial(materialId: string) {
    return this.prisma.counterpartyOffer.findMany({
      where: { materialId },
      include: offerInclude,
      orderBy: [{ isPrimary: 'desc' }, { price: 'asc' }],
    });
  }

  async createOffer(dto: CreateOfferDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.counterpartyOffer.updateMany({
          where: { materialId: dto.materialId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.counterpartyOffer.create({
        data: {
          counterpartyId: dto.counterpartyId,
          materialId: dto.materialId,
          price: dto.price,
          deliveryMethod: dto.deliveryMethod?.trim(),
          supplyStatus: dto.supplyStatus?.trim(),
          isPrimary: dto.isPrimary ?? false,
        },
        include: offerInclude,
      });
    });
  }

  async updateOffer(id: string, dto: UpdateOfferDto) {
    const existing = await this.prisma.counterpartyOffer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Позиция прайс-листа не найдена');

    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.counterpartyOffer.updateMany({
          where: { materialId: existing.materialId, isPrimary: true, id: { not: id } },
          data: { isPrimary: false },
        });
      }

      return tx.counterpartyOffer.update({
        where: { id },
        data: {
          price: dto.price,
          deliveryMethod: dto.deliveryMethod?.trim(),
          supplyStatus: dto.supplyStatus?.trim(),
          isPrimary: dto.isPrimary,
        },
        include: offerInclude,
      });
    });
  }

  async removeOffer(id: string) {
    const existing = await this.prisma.counterpartyOffer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Позиция прайс-листа не найдена');
    await this.prisma.counterpartyOffer.delete({ where: { id } });
    return { success: true };
  }
}
