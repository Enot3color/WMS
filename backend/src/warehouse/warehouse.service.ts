import { Injectable } from '@nestjs/common';
import { RequestStatus } from '@generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ACTIVE_STATUSES: RequestStatus[] = [
  RequestStatus.SUBMITTED,
  RequestStatus.IN_PROGRESS,
  RequestStatus.AWAITING_SUPPLY,
];

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [requests, replenishment] = await Promise.all([
      this.prisma.managerRequest.findMany({
        where: { status: { in: ACTIVE_STATUSES } },
        include: {
          manager: {
            select: { id: true, firstName: true, lastName: true, login: true },
          },
          lines: {
            include: {
              material: {
                include: {
                  unit: true,
                  stockBalance: true,
                },
              },
            },
          },
        },
        orderBy: [{ status: 'asc' }, { expectedDate: 'asc' }, { createdAt: 'desc' }],
        take: 200,
      }),
      this.prisma.material.findMany({
        where: {
          isActive: true,
          minStock: { not: null },
        },
        include: {
          category: true,
          unit: true,
          stockBalance: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const requestItems = requests.map((request) => {
      const overdue = Boolean(
        request.expectedDate && new Date(request.expectedDate) < today,
      );
      const isNew = request.status === RequestStatus.SUBMITTED && !request.warehouseSeenAt;
      return {
        ...request,
        isNew,
        overdue,
      };
    });

    const replenishmentItems = replenishment
      .map((material) => {
        const available = Number(material.stockBalance?.available ?? 0);
        const min = Number(material.minStock ?? 0);
        return {
          ...material,
          available,
          min,
          deficit: Math.max(0, min - available),
          isBelowMin: available < min,
        };
      })
      .filter((item) => item.isBelowMin);

    return {
      requests: requestItems,
      replenishment: replenishmentItems,
    };
  }
}
