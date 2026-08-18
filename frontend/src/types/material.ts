export interface StockBalance {
  available: string;
  reserved: string;
  ordered: string;
}

export interface MaterialOffer {
  id: string;
  price: string;
  isPrimary: boolean;
  deliveryMethod?: string | null;
  supplyStatus?: string | null;
  counterparty: { id: string; name: string };
}

export interface MaterialRecord {
  id: string;
  name: string;
  categoryId: string;
  unitId: string;
  series?: string | null;
  color?: string | null;
  densityGsm?: number | null;
  thicknessMicron?: number | null;
  texture?: string | null;
  coating?: string | null;
  dimensions?: string | null;
  description?: string | null;
  minStock?: string | null;
  purchaseBatch?: string | null;
  isActive: boolean;
  category: { id: string; name: string };
  unit: { id: string; name: string; shortName: string };
  stockBalance?: StockBalance | null;
  offers?: MaterialOffer[];
  isBelowMin?: boolean;
}

export interface CreateMaterialRequest {
  name: string;
  categoryId: string;
  unitId: string;
  series?: string;
  color?: string;
  densityGsm?: number;
  thicknessMicron?: number;
  texture?: string;
  coating?: string;
  dimensions?: string;
  description?: string;
  minStock?: number;
  purchaseBatch?: number;
  isActive?: boolean;
}

export type UpdateMaterialRequest = Partial<CreateMaterialRequest>;
