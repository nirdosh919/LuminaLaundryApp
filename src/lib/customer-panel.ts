/**
 * API adapter for the customer panel.
 *
 * IMPORTANT: adapt paths and response parsing to the verified Laravel route list.
 * Prefer reusing the existing `mobile-api.ts` / `laundry-api.ts` shared client.
 */
export type LaundryService = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  unit?: string;
  imageUrl?: string;
};

export type CustomerAddress = {
  id: string;
  label: string;
  name?: string;
  phone?: string;
  addressLine: string;
  city?: string;
  postalCode?: string;
  isDefault?: boolean;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt?: string;
  pickupDate?: string;
  total: number;
  itemCount?: number;
};

export type CartLine = { service: LaundryService; quantity: number };

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "https://luminalaundry.com").replace(/\/+$/, "");

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const raw = await response.text();
  let body: any = null;
  try { body = raw ? JSON.parse(raw) : null; } catch { /* API may return non-JSON */ }
  if (!response.ok) {
    const message = body?.message || body?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

function unwrapList<T>(body: any): T[] {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  if (Array.isArray(body?.services)) return body.services;
  if (Array.isArray(body?.orders)) return body.orders;
  return [];
}

export const customerPanelApi = {
  async services(): Promise<LaundryService[]> {
    // Confirm this path against `php artisan route:list --path=mobile`.
    const body = await request<any>("/api/mobile/services");
    return unwrapList<any>(body).map((x, i) => ({
      id: String(x.id ?? x.uuid ?? i),
      name: String(x.name ?? x.title ?? "Laundry service"),
      description: x.description ?? x.short_description ?? "",
      category: x.category?.name ?? x.category ?? "Laundry",
      price: Number(x.price ?? x.base_price ?? x.amount ?? 0),
      unit: x.unit ?? "item",
      imageUrl: x.image_url ?? x.image ?? undefined,
    }));
  },

  async orders(): Promise<CustomerOrder[]> {
    // Requires a valid customer token. Reuse the project's shared authenticated client.
    const body = await request<any>("/api/mobile/orders");
    return unwrapList<any>(body).map((x, i) => ({
      id: String(x.id ?? x.uuid ?? i),
      orderNumber: String(x.order_number ?? x.order_no ?? x.reference ?? x.id ?? `Order ${i + 1}`),
      status: String(x.status ?? "Pending"),
      createdAt: x.created_at ?? x.createdAt,
      pickupDate: x.pickup_date ?? x.pickup_at,
      total: Number(x.total ?? x.total_amount ?? x.grand_total ?? 0),
      itemCount: Number(x.item_count ?? x.items_count ?? x.items?.length ?? 0),
    }));
  },

  async addresses(): Promise<CustomerAddress[]> {
    // Do NOT assume `/api/mobile/addresses` exists: the project previously reported a 404.
    // Change this route to the exact customer address route exposed by the active Laravel backend.
    const body = await request<any>("/api/mobile/addresses");
    return unwrapList<any>(body).map((x, i) => ({
      id: String(x.id ?? x.uuid ?? i),
      label: String(x.label ?? x.type ?? (x.is_default ? "Default" : "Address")),
      name: x.name ?? x.contact_name,
      phone: x.phone ?? x.contact_phone,
      addressLine: String(x.address_line ?? x.address ?? x.full_address ?? ""),
      city: x.city,
      postalCode: x.postal_code ?? x.pincode,
      isDefault: Boolean(x.is_default ?? x.isDefault),
    }));
  },
};

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}
