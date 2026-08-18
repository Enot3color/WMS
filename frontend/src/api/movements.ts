import { api } from './client';

export interface MovementLine {
  id: string;
  quantity: string;
  material: {
    id: string;
    name: string;
    category: { name: string };
    unit: { shortName: string };
  };
}

export interface MovementDocument {
  id: string;
  number: number;
  type: string;
  reason?: string | null;
  comment?: string | null;
  postedAt?: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
  lines: MovementLine[];
}

export interface CreateMovementRequest {
  type: 'RECEIPT' | 'ISSUE' | 'WRITE_OFF' | 'RETURN';
  lines: Array<{ materialId: string; quantity: number; unitPrice?: number }>;
  reason?: string;
  comment?: string;
  dealNumber?: string;
}

export function fetchMovements(params?: { search?: string; type?: string }) {
  return api
    .get<MovementDocument[]>('/movements', { params })
    .then((response) => response.data);
}

export function createMovement(data: CreateMovementRequest) {
  return api.post<MovementDocument>('/movements', data).then((response) => response.data);
}
