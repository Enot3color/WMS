import { UserRole } from '@generated/prisma/client';

export type PermissionAction = 'read' | 'create' | 'update' | 'delete';

export const SCREEN_CODES = {
  DASHBOARD: 'dashboard',
  WAREHOUSE: 'warehouse',
  MATERIALS: 'materials',
  ORDERS: 'orders',
  SUPPLIER_ORDERS: 'supplier_orders',
  USERS: 'users',
  REFERENCES: 'references',
  PERMISSIONS: 'permissions',
} as const;

export type ScreenCode = (typeof SCREEN_CODES)[keyof typeof SCREEN_CODES];

export interface ScreenDefinition {
  code: ScreenCode;
  name: string;
  path: string;
  sortOrder: number;
}

export const APP_SCREENS: ScreenDefinition[] = [
  { code: SCREEN_CODES.DASHBOARD, name: 'Рабочий стол', path: '/', sortOrder: 10 },
  { code: SCREEN_CODES.WAREHOUSE, name: 'Склад', path: '/warehouse', sortOrder: 20 },
  { code: SCREEN_CODES.ORDERS, name: 'Заявки', path: '/orders', sortOrder: 30 },
  { code: SCREEN_CODES.SUPPLIER_ORDERS, name: 'Заказы контрагентам', path: '/supplier-orders', sortOrder: 40 },
  { code: SCREEN_CODES.MATERIALS, name: 'Номенклатура', path: '/materials', sortOrder: 50 },
  { code: SCREEN_CODES.USERS, name: 'Пользователи', path: '/users', sortOrder: 60 },
  { code: SCREEN_CODES.REFERENCES, name: 'Справочники', path: '/references', sortOrder: 70 },
  { code: SCREEN_CODES.PERMISSIONS, name: 'Настройка доступов', path: '/permissions', sortOrder: 80 },
];

export interface RolePermissionDefaults {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const none: RolePermissionDefaults = {
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
};

const readOnly: RolePermissionDefaults = {
  canRead: true,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
};

const full: RolePermissionDefaults = {
  canRead: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
};

const warehouseOps: RolePermissionDefaults = {
  canRead: true,
  canCreate: true,
  canUpdate: true,
  canDelete: false,
};

export const DEFAULT_ROLE_PERMISSIONS: Record<
  UserRole,
  Record<ScreenCode, RolePermissionDefaults>
> = {
  [UserRole.ADMIN]: {
    dashboard: full,
    warehouse: full,
    materials: full,
    orders: full,
    supplier_orders: full,
    users: full,
    references: full,
    permissions: full,
  },
  [UserRole.MANAGER]: {
    dashboard: readOnly,
    warehouse: none,
    materials: readOnly,
    orders: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    supplier_orders: readOnly,
    users: none,
    references: readOnly,
    permissions: none,
  },
  [UserRole.WAREHOUSE]: {
    dashboard: readOnly,
    warehouse: warehouseOps,
    materials: readOnly,
    orders: { canRead: true, canCreate: false, canUpdate: true, canDelete: false },
    supplier_orders: warehouseOps,
    users: none,
    references: readOnly,
    permissions: none,
  },
};
