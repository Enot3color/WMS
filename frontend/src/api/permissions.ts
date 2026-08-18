import { api } from './client';
import type { PermissionsMatrix, ScreenPermission } from '../types/permissions';

export async function fetchMyPermissions(): Promise<{ permissions: ScreenPermission[] }> {
  const response = await api.get<{ permissions: ScreenPermission[] }>('/permissions/me');
  return response.data;
}

export async function fetchPermissionsMatrix(): Promise<PermissionsMatrix> {
  const response = await api.get<PermissionsMatrix>('/permissions/matrix');
  return response.data;
}

export async function updatePermissionsMatrix(
  items: Array<{
    role: string;
    screenCode: string;
    permissions: {
      canRead: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    };
  }>,
): Promise<PermissionsMatrix> {
  const response = await api.put<PermissionsMatrix>('/permissions/matrix', { items });
  return response.data;
}
