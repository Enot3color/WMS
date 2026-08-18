import { api } from './client';

export interface SupplierOrderLine {
  id?: string;
  materialId: string;
  quantity: string | number;
  unitPrice: string | number;
  material?: { id: string; name: string; unit: { shortName: string } };
}

export interface SupplierOrderRecord {
  id: string;
  number: number;
  status: string;
  deliveryMethod?: string | null;
  createdAt: string;
  counterparty: { id: string; name: string };
  managerRequest?: { id: string; number: number } | null;
  lines: SupplierOrderLine[];
}

export interface SupplierOrderPreview {
  requestId: string;
  requestNumber: number;
  counterpartyId: string | null;
  counterpartyName: string | null;
  deliveryMethod: string | null;
  lines: Array<{
    materialId: string;
    materialName: string;
    unit: string;
    required: number;
    available: number;
    shortage: number;
    quantity: number;
    unitPrice: number;
    counterpartyId: string | null;
    counterpartyName: string | null;
    deliveryMethod: string | null;
  }>;
}

export function fetchSupplierOrders(params?: { status?: string; managerRequestId?: string }) {
  return api.get<SupplierOrderRecord[]>('/supplier-orders', { params }).then((r) => r.data);
}

export function previewSupplierOrder(requestId: string) {
  return api
    .get<SupplierOrderPreview>(`/supplier-orders/from-request/${requestId}`)
    .then((r) => r.data);
}

export function createSupplierOrder(data: {
  counterpartyId: string;
  managerRequestId?: string;
  deliveryMethod?: string;
  lines: Array<{ materialId: string; quantity: number; unitPrice: number }>;
}) {
  return api.post<SupplierOrderRecord>('/supplier-orders', data).then((r) => r.data);
}

export function updateSupplierOrder(id: string, data: { status?: string }) {
  return api.patch<SupplierOrderRecord>(`/supplier-orders/${id}`, data).then((r) => r.data);
}
