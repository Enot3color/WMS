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

export interface ScreenPermission {
  screenCode: string;
  screenName: string;
  path: string | null;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface PermissionsMatrixRole {
  role: string;
  screens: ScreenPermission[];
}

export interface PermissionsMatrix {
  roles: PermissionsMatrixRole[];
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Руководитель',
  MANAGER: 'Менеджер',
  WAREHOUSE: 'Кладовщик',
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Новая',
  IN_PROGRESS: 'В работе',
  AWAITING_SUPPLY: 'Ожидает поставки',
  ISSUED: 'Выдано',
  COMPLETED: 'Выполнено',
  CANCELLED: 'Отменён',
};

export const SUPPLIER_ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  SENT: 'Отправлен',
  IN_TRANSIT: 'В пути',
  DELIVERED: 'Доставлен',
  ACCEPTED: 'Принят',
};

export const COUNTERPARTY_TYPE_LABELS: Record<string, string> = {
  SUPPLIER: 'Поставщик',
  CONTRACTOR: 'Подрядчик',
  BOTH: 'Поставщик и подрядчик',
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  RECEIPT: 'Поступило',
  ISSUE: 'Выдано',
  WRITE_OFF: 'Списание',
  RETURN: 'Возврат',
};

export const STATUS_GROUP_LABELS: Record<string, string> = {
  request_status: 'Статусы заявок',
  movement_type: 'Типы движений',
  movement_status: 'Статусы документов',
  supplier_order_status: 'Статусы заказов контрагентам',
};
