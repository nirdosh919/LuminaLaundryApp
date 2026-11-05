import { apiRequest } from "@/lib/mobile-api";

export type CatalogService = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  vendor_id: number;
  vendor_name: string | null;
  variants: { id: number; name: string; price: number }[];
};

export type MobileOrder = {
  id: number;
  order_number: string;
  status: string;
  status_label: string;
  pickup_date: string | null;
  pickup_time_slot: string | null;
  total_amount: number;
  created_at: string | null;
  vendor_name: string | null;
  service: string;
  address: string | null;
  items?: { name: string; quantity: number; subtotal: number }[];
};

export type MobileOrderDetails = MobileOrder & {
  delivery_date: string | null;
  delivery_time_slot: string | null;
  payment_status: string;
  payment_method: string;
  delivery_address: string | null;
};

export type OrderHistoryEntry = {
  status: string;
  status_label: string;
  remarks: string | null;
  created_at: string | null;
};

export type AdminOrder = {
  id: number;
  order_number: string;
  status: string;
  status_label: string;
  customer_name: string | null;
  phone: string | null;
  service: string;
  vendor_name: string | null;
  pickup: string | null;
  address: string | null;
  amount: number;
  created_at: string | null;
};

export type AdminDashboardStats = {
  total_orders: number;
  pending: number;
  confirmed: number;
  in_progress: number;
  delivered: number;
  cancelled: number;
};

export type RemoteAddress = {
  id: number;
  label: string;
  full_address: string;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
};

export type PickupAvailability = {
  id: string;
  date: string;
  starts_at: string;
  ends_at: string;
};

export type VendorOrder = {
  id: number; order_number: string; status: string; status_label: string; customer_name: string | null; phone: string | null;
  pickup: string | null; pickup_time_slot: string | null; address: string | null; amount: number; pickup_driver: string | null; delivery_driver: string | null;
  items: { name: string; quantity: number }[];
};

export type DriverTask = {
  id: number; order_number: string; role: "pickup" | "delivery"; status: string; status_label: string; customer_name: string | null; phone: string | null; address: string | null; response: string | null; completed_at: string | null;
};

export type VendorDriver = { id: number; name: string; phone: string | null; status: string };

type PaginatedListResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
};

function isCatalogService(value: unknown): value is CatalogService {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const service = value as Record<string, unknown>;
  if (
    typeof service.id !== "number" || !Number.isInteger(service.id) || service.id <= 0 ||
    typeof service.name !== "string" ||
    (service.description !== null && typeof service.description !== "string") ||
    typeof service.price !== "number" || !Number.isFinite(service.price) || service.price < 0 ||
    (service.category !== null && typeof service.category !== "string") ||
    typeof service.vendor_id !== "number" || !Number.isInteger(service.vendor_id) || service.vendor_id <= 0 ||
    (service.vendor_name !== null && typeof service.vendor_name !== "string") ||
    !Array.isArray(service.variants)
  ) return false;

  return service.variants.every((variant: unknown) => {
    if (!variant || typeof variant !== "object" || Array.isArray(variant)) return false;
    const option = variant as Record<string, unknown>;
    return typeof option.id === "number" && Number.isInteger(option.id) && option.id > 0 &&
      typeof option.name === "string" &&
      typeof option.price === "number" && Number.isFinite(option.price) && option.price >= 0;
  });
}

export async function fetchServices(search = ""): Promise<CatalogService[]> {
  const query = search.trim()
    ? `&search=${encodeURIComponent(search.trim())}`
    : "";
  const services: CatalogService[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const response = await apiRequest<PaginatedListResponse<CatalogService>>(
      `/api/mobile/services?page=${page}${query}`,
    );
    if (
      !response ||
      !Array.isArray(response.data) ||
      !Number.isInteger(response.current_page) ||
      !Number.isInteger(response.last_page) ||
      response.current_page !== page ||
      response.last_page < page ||
      !response.data.every(isCatalogService)
    ) {
      throw new Error("The service catalogue returned an invalid page.");
    }

    services.push(...response.data);
    lastPage = response.last_page;
    page += 1;
  } while (page <= lastPage);

  return services;
}

export async function createBooking(input: {
  items: { service_item_id: number; variant_id: number | null; quantity: number }[];
  label: string;
  full_address: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  pickup_date: string;
  pickup_time_slot: string | null;
  delivery_date: string;
  delivery_time_slot: string | null;
}): Promise<MobileOrder> {
  const response = await apiRequest<{ data: MobileOrder }>(
    "/api/mobile/bookings",
    { method: "POST", body: JSON.stringify(input) },
  );
  if (
    !response ||
    !response.data ||
    typeof response.data.id !== "number" ||
    typeof response.data.order_number !== "string" ||
    !response.data.order_number.trim()
  ) {
    throw new Error("The server returned an invalid booking response. Check your orders before retrying.");
  }
  return response.data;
}

export async function fetchOrdersPage(page = 1): Promise<{ data: MobileOrder[]; current_page: number; last_page: number }> {
  const response = await apiRequest<{ data: MobileOrder[]; current_page: number; last_page: number }>(
    `/api/mobile/orders?page=${page}`,
  );
  if (!response || !Array.isArray(response.data) || !Number.isInteger(response.current_page) || !Number.isInteger(response.last_page)) {
    throw new Error("The order list returned an invalid page.");
  }
  return response;
}

export async function fetchOrders(): Promise<MobileOrder[]> {
  const orders: MobileOrder[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const response = await fetchOrdersPage(page);
    if (response.current_page !== page || response.last_page < page) throw new Error("The order list returned inconsistent pagination.");
    orders.push(...response.data);
    lastPage = response.last_page;
    page += 1;
  } while (page <= lastPage);
  return orders;
}

export async function fetchOrderDetails(id: number): Promise<MobileOrderDetails> {
  const response = await apiRequest<{ data: MobileOrderDetails }>(`/api/mobile/orders/${id}`);
  if (!response?.data || typeof response.data.id !== "number") {
    throw new Error("The order details response was invalid.");
  }
  return response.data;
}

export async function fetchOrderHistory(id: number): Promise<OrderHistoryEntry[]> {
  const response = await apiRequest<{ data: OrderHistoryEntry[] }>(`/api/mobile/orders/${id}/history`);
  if (!response || !Array.isArray(response.data)) throw new Error("The order history response was invalid.");
  return response.data;
}

export async function cancelOrder(id: number): Promise<{ id: number; status: string; status_label: string }> {
  const response = await apiRequest<{ data: { id: number; status: string; status_label: string } }>(
    `/api/mobile/orders/${id}/cancel`,
    { method: "POST", body: JSON.stringify({}) },
  );
  if (!response?.data || typeof response.data.id !== "number") throw new Error("The cancellation response was invalid.");
  return response.data;
}

export async function fetchAdminOrdersPage(page = 1): Promise<{ data: AdminOrder[]; current_page: number; last_page: number }> {
  return apiRequest(`/api/mobile/admin/orders?page=${page}`);
}

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const orders: AdminOrder[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const response = await fetchAdminOrdersPage(page);
    if (!response || !Array.isArray(response.data) || response.current_page !== page || response.last_page < page) {
      throw new Error("The admin order list returned an invalid page.");
    }
    orders.push(...response.data);
    lastPage = response.last_page;
    page += 1;
  } while (page <= lastPage);
  return orders;
}

export async function updateAdminOrderStatus(id: number, status: string): Promise<AdminOrder> {
  const response = await apiRequest<{ data: AdminOrder }>(`/api/mobile/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!response?.data?.id) throw new Error("The server returned an invalid admin order update.");
  return response.data;
}

export async function fetchAddresses(): Promise<RemoteAddress[]> {
  const response = await apiRequest<{ data: RemoteAddress[] }>("/api/mobile/addresses");
  if (!response || !Array.isArray(response.data)) throw new Error("The address list response was invalid.");
  return response.data;
}

export async function createAddress(input: Omit<RemoteAddress, "id">): Promise<RemoteAddress> {
  const response = await apiRequest<{ data: RemoteAddress }>("/api/mobile/addresses", { method: "POST", body: JSON.stringify(input) });
  if (!response?.data || typeof response.data.id !== "number") throw new Error("The address response was invalid.");
  return response.data;
}

export async function updateAddress(id: number, input: Omit<RemoteAddress, "id">): Promise<RemoteAddress> {
  const response = await apiRequest<{ data: RemoteAddress }>(`/api/mobile/addresses/${id}`, { method: "PUT", body: JSON.stringify(input) });
  if (!response?.data || typeof response.data.id !== "number") throw new Error("The address response was invalid.");
  return response.data;
}

export async function removeAddress(id: number): Promise<void> {
  await apiRequest(`/api/mobile/addresses/${id}`, { method: "DELETE" });
}

export async function makeAddressDefault(id: number): Promise<RemoteAddress> {
  const response = await apiRequest<{ data: RemoteAddress }>(`/api/mobile/addresses/${id}/default`, { method: "PATCH", body: JSON.stringify({}) });
  if (!response?.data || typeof response.data.id !== "number") throw new Error("The default address response was invalid.");
  return response.data;
}

export async function checkRemoteServiceability(city: string, state: string, pincode: string): Promise<{ status: "serviceable" | "unsupported"; message: string; zone?: string }> {
  const response = await apiRequest<{ data: { status: "serviceable" | "unsupported"; message: string; zone?: string } }>(`/api/mobile/serviceability?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&pincode=${encodeURIComponent(pincode)}`);
  if (!response?.data || !response.data.status || !response.data.message) throw new Error("The serviceability response was invalid.");
  return response.data;
}

export async function fetchRemotePickupSlots(vendorId: number, fromDate: string, toDate: string): Promise<PickupAvailability[]> {
  const response = await apiRequest<{ data: PickupAvailability[] }>(`/api/mobile/vendors/${vendorId}/availability?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}&type=pickup`);
  if (!response || !Array.isArray(response.data)) throw new Error("The pickup availability response was invalid.");
  return response.data;
}

export async function requestPasswordReset(email: string, role: "customer" | "vendor" = "customer"): Promise<string> {
  const response = await apiRequest<{ message: string }>("/api/mobile/auth/password/forgot", { method: "POST", body: JSON.stringify({ email, role }) });
  if (!response?.message) throw new Error("The password reset response was invalid.");
  return response.message;
}

export async function fetchVendorOrders(): Promise<VendorOrder[]> {
  const orders: VendorOrder[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const response = await apiRequest<PaginatedListResponse<VendorOrder>>(
      `/api/mobile/vendor/orders?page=${page}`,
    );
    if (
      !response ||
      !Array.isArray(response.data) ||
      !Number.isInteger(response.current_page) ||
      !Number.isInteger(response.last_page) ||
      response.current_page !== page ||
      response.last_page < page
    ) {
      throw new Error("The vendor order list returned an invalid page.");
    }
    orders.push(...response.data);
    lastPage = response.last_page;
    page += 1;
  } while (page <= lastPage);
  return orders;
}

export async function fetchVendorDrivers(): Promise<VendorDriver[]> {
  const response = await apiRequest<{ data: VendorDriver[] }>('/api/mobile/vendor/drivers');
  if (!response || !Array.isArray(response.data)) throw new Error('The vendor driver response was invalid.');
  return response.data;
}

export async function fetchAdminDashboard(): Promise<AdminDashboardStats> {
  const response = await apiRequest<{ data: AdminDashboardStats }>('/api/mobile/admin/dashboard');
  if (!response?.data || typeof response.data.total_orders !== 'number') throw new Error('The admin dashboard response was invalid.');
  return response.data;
}

export async function assignVendorDriver(id: number, role: "pickup" | "delivery", driverId: number): Promise<VendorOrder> {
  const response = await apiRequest<{ data: VendorOrder }>(`/api/mobile/vendor/orders/${id}/assign-driver`, { method: "PATCH", body: JSON.stringify({ role, driver_id: driverId }) });
  if (!response?.data?.id) throw new Error("The driver assignment response was invalid.");
  return response.data;
}

export async function fetchDriverTasks(): Promise<DriverTask[]> {
  const response = await apiRequest<{ data: DriverTask[] }>("/api/mobile/driver/tasks");
  if (!response || !Array.isArray(response.data)) throw new Error("The driver task response was invalid.");
  return response.data;
}

export async function performDriverAction(id: number, role: "pickup" | "delivery", action: "accept" | "decline" | "complete"): Promise<DriverTask> {
  const response = await apiRequest<{ data: DriverTask }>(`/api/mobile/driver/orders/${id}/${role}/${action}`, { method: "POST", body: JSON.stringify({}) });
  if (!response?.data?.id) throw new Error("The driver action response was invalid.");
  return response.data;
}

export async function toggleDriverStatus(): Promise<string> {
  const response = await apiRequest<{ data: { status: string } }>("/api/mobile/driver/status/toggle", { method: "POST", body: JSON.stringify({}) });
  if (!response?.data?.status) throw new Error("The driver status response was invalid.");
  return response.data.status;
}
