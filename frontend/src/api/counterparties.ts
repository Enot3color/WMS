import { api } from './client';

export interface Counterparty {
  id: string;
  name: string;
  type: 'SUPPLIER' | 'CONTRACTOR' | 'BOTH';
  legalEntity?: string | null;
  contactInfo?: string | null;
  address?: string | null;
  notes?: string | null;
  _count?: { offers: number };
}

export interface CounterpartyOffer {
  id: string;
  counterpartyId: string;
  materialId: string;
  price: string;
  deliveryMethod?: string | null;
  supplyStatus?: string | null;
  isPrimary: boolean;
  counterparty: Counterparty;
  material: { id: string; name: string; unit: { shortName: string } };
}

export const counterpartiesApi = {
  list: (params?: { search?: string; type?: string }) =>
    api.get<Counterparty[]>('/counterparties', { params }).then((r) => r.data),
  create: (data: Partial<Counterparty> & { name: string }) =>
    api.post<Counterparty>('/counterparties', data).then((r) => r.data),
  update: (id: string, data: Partial<Counterparty>) =>
    api.patch<Counterparty>(`/counterparties/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/counterparties/${id}`).then((r) => r.data),
};

export const offersApi = {
  list: (params?: { search?: string; counterpartyId?: string; materialId?: string }) =>
    api.get<CounterpartyOffer[]>('/counterparty-offers', { params }).then((r) => r.data),
  byMaterial: (materialId: string) =>
    api.get<CounterpartyOffer[]>(`/counterparty-offers/by-material/${materialId}`).then((r) => r.data),
  create: (data: {
    counterpartyId: string;
    materialId: string;
    price: number;
    deliveryMethod?: string;
    supplyStatus?: string;
    isPrimary?: boolean;
  }) => api.post<CounterpartyOffer>('/counterparty-offers', data).then((r) => r.data),
  update: (id: string, data: Partial<{ price: number; deliveryMethod: string; supplyStatus: string; isPrimary: boolean }>) =>
    api.patch<CounterpartyOffer>(`/counterparty-offers/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/counterparty-offers/${id}`).then((r) => r.data),
};
