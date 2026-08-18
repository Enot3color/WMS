import { SetMetadata } from '@nestjs/common';
import { PermissionAction } from '../permissions.constants';

export const PERMISSION_KEY = 'permission';

export interface RequiredPermission {
  screen: string;
  action: PermissionAction;
}

export const RequirePermission = (screen: string, action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, { screen, action } satisfies RequiredPermission);
