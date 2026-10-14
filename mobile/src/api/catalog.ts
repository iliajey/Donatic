import { apiFetch } from './client';

export interface CatalogItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  image_url: string | null;
  visual_key: string;
  color: string;
  is_active: boolean;
  sort_order: number;
}

export interface Catalog {
  currency: string;
  base_donuts: CatalogItem[];
  sauces: CatalogItem[];
  toppings: CatalogItem[];
}

export function fetchCatalog(): Promise<Catalog> {
  return apiFetch<Catalog>('/api/v1/catalog/');
}

export interface PriceBreakdownItem {
  id: number;
  name: string;
  price: number;
}

export interface ValidatePriceRequest {
  base_donut_id: number;
  sauce_id: number | null;
  topping_ids: number[];
}

export interface ValidatePriceResponse {
  valid: boolean;
  canonical: ValidatePriceRequest;
  composition_hash: string;
  breakdown: {
    base: PriceBreakdownItem;
    sauce: PriceBreakdownItem | null;
    toppings: PriceBreakdownItem[];
    toppings_total: number;
    currency: string;
  };
  total_price: number;
  currency: string;
}

export function validateComposition(req: ValidatePriceRequest): Promise<ValidatePriceResponse> {
  return apiFetch<ValidatePriceResponse>('/api/v1/donut-compositions/validate-price/', {
    method: 'POST',
    body: JSON.stringify({
      base_donut_id: req.base_donut_id,
      sauce_id: req.sauce_id,
      topping_ids: req.topping_ids,
    }),
  });
}
