import { api } from './client';
import type {
  CreateMaterialRequest,
  MaterialRecord,
  UpdateMaterialRequest,
} from '../types/material';

export function fetchMaterials(params?: {
  search?: string;
  categoryId?: string;
}) {
  return api
    .get<MaterialRecord[]>('/materials', { params })
    .then((response) => response.data);
}

export function fetchStockPositions() {
  return api
    .get<MaterialRecord[]>('/materials/stock-positions')
    .then((response) => response.data);
}

export function createMaterial(data: CreateMaterialRequest) {
  return api.post<MaterialRecord>('/materials', data).then((response) => response.data);
}

export function updateMaterial(id: string, data: UpdateMaterialRequest) {
  return api.patch<MaterialRecord>(`/materials/${id}`, data).then((response) => response.data);
}

export function deleteMaterial(id: string) {
  return api.delete(`/materials/${id}`).then((response) => response.data);
}
