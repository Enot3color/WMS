import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovementStatus, MovementType, Prisma } from '@generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto, MovementQueryDto } from './dto/movement.dto';

const movementInclude = {
  user: {
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
        },
      },
    },
  },
} satisfies Prisma.MovementDocumentInclude;

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: MovementQueryDto) {
    const where: Prisma.MovementDocumentWhereInput = {
      status: MovementStatus.POSTED,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.lines = {
        some: {
          material: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      };
    }

    return this.prisma.movementDocument.findMany({
      where,
      include: movementInclude,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.movementDocument.findUnique({
      where: { id },
      include: movementInclude,
    });

    if (!document) {
      throw new NotFoundException('Документ движения не найден');
    }

    return document;
  }

  async create(userId: string, dto: CreateMovementDto) {
    if (dto.type === MovementType.ISSUE) {
      for (const line of dto.lines) {
        const balance = await this.prisma.stockBalance.findUnique({
          where: { materialId: line.materialId },
        });
        const available = Number(balance?.available ?? 0);
        if (available < line.quantity) {
          throw new BadRequestException(
            `Недостаточно остатка для выдачи (${available} доступно)`,
          );
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const document = await tx.movementDocument.create({
        data: {
          type: dto.type,
          status: MovementStatus.POSTED,
          userId,
          reason: dto.reason?.trim(),
          comment: dto.comment?.trim(),
          postedAt: new Date(),
          lines: {
            create: dto.lines.map((line) => ({
              materialId: line.materialId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
            })),
          },
        },
        include: movementInclude,
      });

      for (const line of dto.lines) {
        const delta =
          dto.type === MovementType.RECEIPT || dto.type === MovementType.RETURN
            ? line.quantity
            : -line.quantity;

        await tx.stockBalance.upsert({
          where: { materialId: line.materialId },
          create: {
            materialId: line.materialId,
            available: delta,
          },
          update: {
            available: { increment: delta },
          },
        });
      }

      return document;
    });
  }

  getSummary() {
    return this.prisma.movementDocument.groupBy({
      by: ['type'],
      where: { status: MovementStatus.POSTED },
      _count: { _all: true },
    });
  }
}
