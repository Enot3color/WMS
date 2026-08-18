import { Injectable, OnModuleInit } from '@nestjs/common';
import { UserRole } from '@generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  APP_SCREENS,
  DEFAULT_ROLE_PERMISSIONS,
  PermissionAction,
  SCREEN_CODES,
} from './permissions.constants';
import { UpdatePermissionsMatrixDto } from './dto/permissions.dto';

export interface PermissionRecord {
  screenCode: string;
  screenName: string;
  path: string | null;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

@Injectable()
export class PermissionsService implements OnModuleInit {
  private cache = new Map<UserRole, PermissionRecord[]>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureDefaults();
    await this.refreshCache();
  }

  async ensureDefaults() {
    for (const screen of APP_SCREENS) {
      await this.prisma.appScreen.upsert({
        where: { code: screen.code },
        update: {
          name: screen.name,
          path: screen.path,
          sortOrder: screen.sortOrder,
        },
        create: screen,
      });
    }

    await this.prisma.appScreen.deleteMany({
      where: {
        code: { notIn: APP_SCREENS.map((screen) => screen.code) },
      },
    });

    for (const role of Object.values(UserRole)) {
      for (const screen of APP_SCREENS) {
        const defaults = DEFAULT_ROLE_PERMISSIONS[role][screen.code];
        await this.prisma.roleScreenPermission.upsert({
          where: {
            role_screenCode: {
              role,
              screenCode: screen.code,
            },
          },
          update: {},
          create: {
            role,
            screenCode: screen.code,
            ...defaults,
          },
        });
      }
    }

    await this.seedStatusReferences();
  }

  async refreshCache() {
    this.cache.clear();

    for (const role of Object.values(UserRole)) {
      this.cache.set(role, await this.loadRolePermissions(role));
    }
  }

  async getMatrix() {
    const screens = await this.prisma.appScreen.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const permissions = await this.prisma.roleScreenPermission.findMany();
    const byRole = Object.values(UserRole).map((role) => ({
      role,
      screens: screens.map((screen) => {
        const permission = permissions.find(
          (item) => item.role === role && item.screenCode === screen.code,
        );

        return {
          screenCode: screen.code,
          screenName: screen.name,
          path: screen.path,
          canRead: permission?.canRead ?? false,
          canCreate: permission?.canCreate ?? false,
          canUpdate: permission?.canUpdate ?? false,
          canDelete: permission?.canDelete ?? false,
        };
      }),
    }));

    return { roles: byRole };
  }

  async getMyPermissions(role: UserRole) {
    if (!this.cache.has(role)) {
      this.cache.set(role, await this.loadRolePermissions(role));
    }

    return {
      permissions: this.cache.get(role) ?? [],
    };
  }

  async updateMatrix(dto: UpdatePermissionsMatrixDto) {
    for (const item of dto.items) {
      const normalized = this.normalizePermissionFlags(item.permissions);

      await this.prisma.roleScreenPermission.upsert({
        where: {
          role_screenCode: {
            role: item.role,
            screenCode: item.screenCode,
          },
        },
        update: normalized,
        create: {
          role: item.role,
          screenCode: item.screenCode,
          ...normalized,
        },
      });
    }

    await this.refreshCache();
    return this.getMatrix();
  }

  async hasPermission(
    role: UserRole,
    screenCode: string,
    action: PermissionAction,
  ) {
    if (!this.cache.has(role)) {
      this.cache.set(role, await this.loadRolePermissions(role));
    }

    const record = this.cache.get(role)?.find((item) => item.screenCode === screenCode);
    if (!record?.canRead) {
      return false;
    }

    switch (action) {
      case 'read':
        return record.canRead;
      case 'create':
        return record.canCreate;
      case 'update':
        return record.canUpdate;
      case 'delete':
        return record.canDelete;
      default:
        return false;
    }
  }

  private normalizePermissionFlags(flags: {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }) {
    const canRead = flags.canRead;
    const canCreate = canRead && flags.canCreate;
    const canUpdate = canRead && flags.canUpdate;
    const canDelete = canRead && flags.canDelete;

    return { canRead, canCreate, canUpdate, canDelete };
  }

  private async loadRolePermissions(role: UserRole): Promise<PermissionRecord[]> {
    const screens = await this.prisma.appScreen.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    const permissions = await this.prisma.roleScreenPermission.findMany({
      where: { role },
    });

    return screens.flatMap((screen) => {
        const permission = permissions.find((item) => item.screenCode === screen.code);
        if (!permission?.canRead) {
          return [];
        }

        return [{
          screenCode: screen.code,
          screenName: screen.name,
          path: screen.path,
          canRead: permission.canRead,
          canCreate: permission.canCreate,
          canUpdate: permission.canUpdate,
          canDelete: permission.canDelete,
        }];
      });
  }

  private async seedStatusReferences() {
    const defaults = [
      { group: 'request_status', code: 'SUBMITTED', label: 'Новая', sortOrder: 10 },
      { group: 'request_status', code: 'IN_PROGRESS', label: 'В работе', sortOrder: 20 },
      { group: 'request_status', code: 'AWAITING_SUPPLY', label: 'Ожидает поставки', sortOrder: 30 },
      { group: 'request_status', code: 'ISSUED', label: 'Выдано', sortOrder: 40 },
      { group: 'request_status', code: 'COMPLETED', label: 'Выполнено', sortOrder: 50 },
      { group: 'request_status', code: 'CANCELLED', label: 'Отменена', sortOrder: 60 },
      { group: 'movement_type', code: 'RECEIPT', label: 'Приход', sortOrder: 10 },
      { group: 'movement_type', code: 'ISSUE', label: 'Выдача', sortOrder: 20 },
      { group: 'movement_type', code: 'WRITE_OFF', label: 'Списание', sortOrder: 30 },
      { group: 'movement_type', code: 'RETURN', label: 'Возврат', sortOrder: 40 },
      { group: 'movement_status', code: 'DRAFT', label: 'Черновик', sortOrder: 10 },
      { group: 'movement_status', code: 'POSTED', label: 'Проведён', sortOrder: 20 },
      { group: 'movement_status', code: 'REVERSED', label: 'Сторнирован', sortOrder: 30 },
      { group: 'supplier_order_status', code: 'DRAFT', label: 'Черновик', sortOrder: 10 },
      { group: 'supplier_order_status', code: 'SENT', label: 'Отправлен', sortOrder: 20 },
      { group: 'supplier_order_status', code: 'IN_TRANSIT', label: 'В пути', sortOrder: 30 },
      { group: 'supplier_order_status', code: 'DELIVERED', label: 'Доставлен', sortOrder: 40 },
      { group: 'supplier_order_status', code: 'ACCEPTED', label: 'Принят', sortOrder: 50 },
    ];

    for (const item of defaults) {
      await this.prisma.statusReference.upsert({
        where: {
          group_code: {
            group: item.group,
            code: item.code,
          },
        },
        update: {
          label: item.label,
          sortOrder: item.sortOrder,
        },
        create: item,
      });
    }
  }
}
