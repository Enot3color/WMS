import { api } from './client';

export interface RequestLine {
  id: string;
  quantity: string;
  material: {
    id: string;
    name: string;
    category: { name: string };
    unit: { shortName: string };
    stockBalance?: {
      available: string;
      reserved: string;
      ordered: string;
    } | null;
  };
}

export interface ManagerRequestRecord {
  id: string;
  number: number;
  status: string;
  dealNumber?: string | null;
  clientInfo?: string | null;
  comment?: string | null;
  expectedDate?: string | null;
  warehouseSeenAt?: string | null;
  createdAt: string;
  isNew?: boolean;
  overdue?: boolean;
  manager: {
    firstName: string;
    lastName: string;
  };
  lines: RequestLine[];
}

export interface CreateRequestPayload {
  lines: Array<{
    materialId: string;
    quantity: number;
    unitPrice?: number;
  }>;
  dealNumber?: string;
  clientInfo?: string;
  comment?: string;
  expectedDate?: string;
}

export interface AvailabilityLine {
  lineId: string;
  materialId: string;
  materialName: string;
  unit: string;
  required: number;
  available: number;
  shortage: number;
  primaryOffer: {
    id: string;
    counterpartyId: string;
    counterpartyName: string;
    price: number;
    deliveryMethod?: string | null;
  } | null;
}

export interface AvailabilityResponse {
  request: ManagerRequestRecord;
  lines: AvailabilityLine[];
  canIssue: boolean;
  hasShortage: boolean;
}

export function fetchRequests(params?: {
  search?: string;
  status?: string;
  activeOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
}) {
  return api
    .get<ManagerRequestRecord[]>('/requests', { params })
    .then((response) => response.data);
}

export function fetchRequest(id: string) {
  return api.get<ManagerRequestRecord>(`/requests/${id}`).then((response) => response.data);
}

export function fetchRequestAvailability(id: string) {
  return api
    .get<AvailabilityResponse>(`/requests/${id}/availability`)
    .then((response) => response.data);
}

export function createRequest(data: CreateRequestPayload) {
  return api.post<ManagerRequestRecord>('/requests', data).then((response) => response.data);
}

export function updateRequest(
  id: string,
  data: Partial<{
    status: string;
    dealNumber: string;
    clientInfo: string;
    comment: string;
    expectedDate: string;
  }>,
) {
  return api.patch<ManagerRequestRecord>(`/requests/${id}`, data).then((response) => response.data);
}

export function markRequestSeen(id: string) {
  return api.post<ManagerRequestRecord>(`/requests/${id}/mark-seen`).then((r) => r.data);
}

export function issueRequest(id: string) {
  return api.post(`/requests/${id}/issue`).then((response) => response.data);
}
