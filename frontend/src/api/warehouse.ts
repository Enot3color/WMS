import { api } from './client';
import type { ManagerRequestRecord } from './requests';
import type { MaterialRecord } from '../types/material';

export interface WarehouseDashboard {
  requests: ManagerRequestRecord[];
  replenishment: Array<MaterialRecord & { available: number; min: number; deficit: number }>;
}

export function fetchWarehouseDashboard() {
  return api.get<WarehouseDashboard>('/warehouse/dashboard').then((r) => r.data);
}
