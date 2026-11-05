import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CatalogService } from "@/lib/laundry-api";

const CART_KEY = "lumina_cart";

export type CartItem = {
  id: string;
  service_item_id: number;
  variant_id: number | null;
  vendor_id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
};

export function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && item.id.length > 0 &&
    typeof item.service_item_id === "number" && Number.isInteger(item.service_item_id) && item.service_item_id > 0 &&
    (item.variant_id === null || (typeof item.variant_id === "number" && Number.isInteger(item.variant_id) && item.variant_id > 0)) &&
    typeof item.vendor_id === "number" && Number.isInteger(item.vendor_id) && item.vendor_id > 0 &&
    typeof item.name === "string" && item.name.length > 0 &&
    typeof item.price === "number" && Number.isFinite(item.price) && item.price >= 0 &&
    typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 50 &&
    typeof item.unit === "string" && item.unit.length > 0;
}

export function parseCart(raw: string | null): CartItem[] {
  let value: unknown;
  try {
    value = raw ? JSON.parse(raw) as unknown : [];
  } catch {
    throw new Error("The saved cart could not be read. Clear it to start a new cart.");
  }
  if (!Array.isArray(value) || !value.every(isCartItem)) {
    throw new Error("The saved cart has an unsupported format. Clear it to start a new cart.");
  }
  return value;
}

export async function loadCart(): Promise<CartItem[]> {
  return parseCart(await AsyncStorage.getItem(CART_KEY));
}

export async function saveCart(items: CartItem[]): Promise<void> {
  if (!items.every(isCartItem)) throw new Error("The cart contains an invalid service item.");
  await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
}

export async function addCatalogServiceToCart(
  service: CatalogService,
  variantId: number | null,
  quantity = 1,
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
    throw new Error("Choose a quantity between 1 and 50.");
  }
  const variant = variantId === null
    ? null
    : service.variants.find((item) => item.id === variantId) ?? null;
  if (variantId !== null && !variant) {
    throw new Error("The selected service option is no longer available.");
  }
  if (service.variants.length > 0 && !variant) {
    throw new Error("Choose a service option before adding this service to your bag.");
  }

  const cart = await loadCart();
  if (cart.some((item) => item.vendor_id !== service.vendor_id)) {
    throw new Error("Your bag can contain services from one shop at a time. Clear it before switching shops.");
  }
  const id = `${service.id}-${variant?.id ?? "base"}`;
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.quantity = Math.min(50, existing.quantity + quantity);
  } else {
    cart.push({
      id,
      service_item_id: service.id,
      variant_id: variant?.id ?? null,
      vendor_id: service.vendor_id,
      name: variant ? `${service.name} - ${variant.name}` : service.name,
      price: variant?.price ?? service.price,
      quantity,
      unit: "item",
    });
  }
  await saveCart(cart);
}
