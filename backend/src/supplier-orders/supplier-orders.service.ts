import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RequestStatus, SupplierOrderStatus } from '@generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSupplierOrderDto,
  SupplierOrderQueryDto,
  UpdateSupplierOrderDto,
} from './dto/supplier-order.dto';

const orderInclude = {
  counterparty: true,
  createdBy: {
    select: { id: true, firstName: true, lastName: true, login: true },
  },
  managerRequest: {
    select: { id: true, number: true, status: true },
  },
  lines: {
    include: {
      material: { include: { unit: true, category: true } },
    },
  },
} satisfies Prisma.SupplierOrderInclude;

@Injectable()
export class SupplierOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: SupplierOrderQueryDto) {
    const where: Prisma.SupplierOrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.managerRequestId) where.managerRequestId = query.managerRequestId;

    return this.prisma.supplierOrder.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.supplierOrder.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Заказ контрагенту не найден');
    return order;
  }

  async previewFromRequest(requestId: string) {
    const request = await this.prisma.managerRequest.findUnique({
      where: { id: requestId },
      include: {
        lines: {
          include: {
            material: {
              include: {
                unit: true,
                stockBalance: true,
                offers: {
                  include: { counterparty: true },
                  orderBy: [{ isPrimary: 'desc' }, { price: 'asc' }],
                },
              },
            },
          },
        },
      },
    });

    if (!request) throw new NotFoundException('Заявка не найдена');

    const lines = request.lines
      .map((line) => {
        const required = Number(line.quantity);
        const available = Number(line.material.stockBalance?.available ?? 0);
        const shortage = Math.max(0, required - available);
        const offer = line.material.offers[0] ?? null;
        return {
          materialId: line.materialId,
          materialName: line.material.name,
          unit: line.material.unit.shortName,
          required,
          available,
          shortage,
          quantity: shortage,
          unitPrice: offer ? Number(offer.price) : 0,
          counterpartyId: offer?.counterpartyId ?? null,
          counterpartyName: offer?.counterparty.name ?? null,
          deliveryMethod: offer?.deliveryMethod ?? null,
        };
      })
      .filter((line) => line.shortage > 0);

    const grouped = new Map<string, typeof lines>();
    for (const line of lines) {
      const key = line.counterpartyId ?? 'unassigned';
      const group = grouped.get(key) ?? [];
      group.push(line);
      grouped.set(key, group);
    }

    const primaryGroup = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    const counterpartyId = primaryGroup && primaryGroup[0] !== 'unassigned' ? primaryGroup[0] : null;

    return {
      requestId: request.id,
      requestNumber: request.number,
      counterpartyId,
      counterpartyName: lines.find((line) => line.counterpartyId === counterpartyId)?.counterpartyName ?? null,
      deliveryMethod: lines.find((line) => line.counterpartyId === counterpartyId)?.deliveryMethod ?? null,
      lines,
    };
  }

  async create(userId: string, dto: CreateSupplierOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.supplierOrder.create({
        data: {
          counterpartyId: dto.counterpartyId,
          managerRequestId: dto.managerRequestId,
          deliveryMethod: dto.deliveryMethod?.trim(),
          createdById: userId,
          status: SupplierOrderStatus.DRAFT,
          lines: {
            create: dto.lines.map((line) => ({
              materialId: line.materialId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
            })),
          },
        },
        include: orderInclude,
      });

      for (const line of dto.lines) {
        await tx.stockBalance.upsert({
          where: { materialId: line.materialId },
          create: { materialId: line.materialId, ordered: line.quantity },
          update: { ordered: { increment: line.quantity } },
        });
      }

      if (dto.managerRequestId) {
        await tx.managerRequest.update({
          where: { id: dto.managerRequestId },
          data: { status: RequestStatus.AWAITING_SUPPLY },
        });
        await tx.requestStatusLog.create({
          data: {
            requestId: dto.managerRequestId,
            status: RequestStatus.AWAITING_SUPPLY,
            userId,
          },
        });
      }

      return order;
    });
  }

  async update(id: string, dto: UpdateSupplierOrderDto) {
    const existing = await this.findOne(id);

    if (dto.lines) {
      await this.prisma.supplierOrderLine.deleteMany({ where: { supplierOrderId: id } });
    }

    const order = await this.prisma.supplierOrder.update({
      where: { id },
      data: {
        status: dto.status,
        counterpartyId: dto.counterpartyId,
        deliveryMethod: dto.deliveryMethod?.trim(),
        lines: dto.lines
          ? {
              create: dto.lines.map((line) => ({
                materialId: line.materialId,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
              })),
            }
          : undefined,
      },
      include: orderInclude,
    });

    if (
      dto.status === SupplierOrderStatus.ACCEPTED &&
      existing.status !== SupplierOrderStatus.ACCEPTED &&
      existing.managerRequestId
    ) {
      await this.prisma.managerRequest.update({
        where: { id: existing.managerRequestId },
        data: { status: RequestStatus.IN_PROGRESS },
      });
    }

    return order;
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    if (existing.status !== SupplierOrderStatus.DRAFT) {
      throw new BadRequestException('Можно удалить только черновик');
    }
    await this.prisma.supplierOrder.delete({ where: { id } });
    return { success: true };
  }
}
