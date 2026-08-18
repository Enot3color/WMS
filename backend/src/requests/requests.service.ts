import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MovementStatus,
  MovementType,
  Prisma,
  RequestStatus,
  UserRole,
} from '@generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRequestDto,
  RequestQueryDto,
  UpdateRequestDto,
} from './dto/request.dto';

const requestInclude = {
  manager: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      login: true,
    },
  },
  assignee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      login: true,
    },
  },
  lines: {
    include: {
      material: {
        include: {
          category: true,
          unit: true,
          stockBalance: true,
          offers: {
            where: { isPrimary: true },
            include: { counterparty: true },
            take: 1,
          },
        },
      },
    },
  },
} satisfies Prisma.ManagerRequestInclude;

const ACTIVE_STATUSES: RequestStatus[] = [
  RequestStatus.SUBMITTED,
  RequestStatus.IN_PROGRESS,
  RequestStatus.AWAITING_SUPPLY,
  RequestStatus.ISSUED,
];

const CLOSED_STATUSES: RequestStatus[] = [
  RequestStatus.COMPLETED,
  RequestStatus.CANCELLED,
];

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: RequestQueryDto) {
    const where: Prisma.ManagerRequestWhereInput = {};

    if (query.status) {
      where.status = query.status;
    } else if (query.activeOnly) {
      where.status = { in: ACTIVE_STATUSES };
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { dealNumber: { contains: search, mode: 'insensitive' } },
        { clientInfo: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        {
          lines: {
            some: {
              material: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    return this.prisma.managerRequest.findMany({
      where,
      include: requestInclude,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.managerRequest.findUnique({
      where: { id },
      include: requestInclude,
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    return request;
  }

  async create(managerId: string, dto: CreateRequestDto) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.managerRequest.create({
        data: {
          managerId,
          status: RequestStatus.SUBMITTED,
          dealNumber: dto.dealNumber?.trim(),
          clientInfo: dto.clientInfo?.trim(),
          comment: dto.comment?.trim(),
          expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
          lines: {
            create: dto.lines.map((line) => ({
              materialId: line.materialId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
            })),
          },
        },
        include: requestInclude,
      });

      for (const line of dto.lines) {
        await tx.stockBalance.upsert({
          where: { materialId: line.materialId },
          create: {
            materialId: line.materialId,
            reserved: line.quantity,
          },
          update: {
            reserved: { increment: line.quantity },
          },
        });
      }

      await tx.requestStatusLog.create({
        data: {
          requestId: request.id,
          status: RequestStatus.SUBMITTED,
          userId: managerId,
        },
      });

      const warehouseUsers = await tx.user.findMany({
        where: { role: { in: [UserRole.WAREHOUSE, UserRole.ADMIN] }, isActive: true },
        select: { id: true },
      });

      if (warehouseUsers.length > 0) {
        await tx.notification.createMany({
          data: warehouseUsers.map((user) => ({
            userId: user.id,
            type: 'NEW_REQUEST',
            title: `Новая заявка №${request.number}`,
            message: request.clientInfo
              ? `Клиент: ${request.clientInfo}`
              : `Заявка от менеджера, ${request.lines.length} поз.`,
            entityType: 'ManagerRequest',
            entityId: request.id,
          })),
        });
      }

      return request;
    });
  }

  async update(id: string, userId: string, dto: UpdateRequestDto) {
    const existing = await this.findOne(id);

    const request = await this.prisma.managerRequest.update({
      where: { id },
      data: {
        status: dto.status,
        dealNumber: dto.dealNumber?.trim(),
        clientInfo: dto.clientInfo?.trim(),
        comment: dto.comment?.trim(),
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
      },
      include: requestInclude,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.prisma.requestStatusLog.create({
        data: {
          requestId: id,
          status: dto.status,
          userId,
        },
      });

      if (CLOSED_STATUSES.includes(dto.status) && !CLOSED_STATUSES.includes(existing.status)) {
        await this.releaseReserved(existing.lines);
      }
    }

    return request;
  }

  async getAvailability(id: string) {
    const request = await this.findOne(id);
    const lines = request.lines.map((line) => {
      const required = Number(line.quantity);
      const available = Number(line.material.stockBalance?.available ?? 0);
      const shortage = Math.max(0, required - available);
      const primaryOffer = line.material.offers[0] ?? null;
      return {
        lineId: line.id,
        materialId: line.materialId,
        materialName: line.material.name,
        unit: line.material.unit.shortName,
        required,
        available,
        shortage,
        primaryOffer: primaryOffer
          ? {
              id: primaryOffer.id,
              counterpartyId: primaryOffer.counterpartyId,
              counterpartyName: primaryOffer.counterparty.name,
              price: Number(primaryOffer.price),
              deliveryMethod: primaryOffer.deliveryMethod,
            }
          : null,
      };
    });

    const hasShortage = lines.some((line) => line.shortage > 0);
    return {
      request,
      lines,
      canIssue: !hasShortage && request.status !== RequestStatus.ISSUED && request.status !== RequestStatus.COMPLETED && request.status !== RequestStatus.CANCELLED,
      hasShortage,
    };
  }

  async markSeen(id: string, userId: string) {
    const existing = await this.findOne(id);
    const data: Prisma.ManagerRequestUpdateInput = {
      warehouseSeenAt: existing.warehouseSeenAt ?? new Date(),
    };

    if (existing.status === RequestStatus.SUBMITTED) {
      data.status = RequestStatus.IN_PROGRESS;
      data.assignee = { connect: { id: userId } };
    }

    const request = await this.prisma.managerRequest.update({
      where: { id },
      data,
      include: requestInclude,
    });

    if (existing.status === RequestStatus.SUBMITTED) {
      await this.prisma.requestStatusLog.create({
        data: {
          requestId: id,
          status: RequestStatus.IN_PROGRESS,
          userId,
        },
      });
    }

    return request;
  }

  async createIssue(id: string, userId: string) {
    const availability = await this.getAvailability(id);
    if (!availability.canIssue) {
      throw new BadRequestException(
        availability.hasShortage
          ? 'Нельзя оформить выдачу: на складе не хватает позиций'
          : 'Заявка уже выдана или закрыта',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const document = await tx.movementDocument.create({
        data: {
          type: MovementType.ISSUE,
          status: MovementStatus.POSTED,
          userId,
          requestId: id,
          postedAt: new Date(),
          comment: `Выдача по заявке №${availability.request.number}`,
          lines: {
            create: availability.request.lines.map((line) => ({
              materialId: line.materialId,
              quantity: line.quantity,
            })),
          },
        },
      });

      for (const line of availability.request.lines) {
        const qty = Number(line.quantity);
        await tx.stockBalance.update({
          where: { materialId: line.materialId },
          data: {
            available: { decrement: qty },
            reserved: { decrement: qty },
          },
        });
      }

      const request = await tx.managerRequest.update({
        where: { id },
        data: { status: RequestStatus.ISSUED },
        include: requestInclude,
      });

      await tx.requestStatusLog.create({
        data: {
          requestId: id,
          status: RequestStatus.ISSUED,
          userId,
        },
      });

      return { request, document };
    });
  }

  getStats() {
    return this.prisma.managerRequest.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
  }

  private async releaseReserved(
    lines: Array<{ materialId: string; quantity: Prisma.Decimal }>,
  ) {
    for (const line of lines) {
      const qty = Number(line.quantity);
      const balance = await this.prisma.stockBalance.findUnique({
        where: { materialId: line.materialId },
      });
      if (!balance) continue;
      await this.prisma.stockBalance.update({
        where: { materialId: line.materialId },
        data: { reserved: { decrement: qty } },
      });
    }
  }
}
