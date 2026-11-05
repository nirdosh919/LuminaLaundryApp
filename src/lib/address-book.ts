import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocationPoint } from "@/lib/location-search";
import { createAddress, fetchAddresses, makeAddressDefault, removeAddress, updateAddress, type RemoteAddress } from "@/lib/laundry-api";
import { getAccessToken } from "@/lib/token-storage";

const ADDRESSES_KEY = "lumina_addresses_v2";
const LEGACY_ADDRESSES_KEY = "lumina_addresses";
const SELECTED_ADDRESS_KEY = "lumina_selected_address_v1";

export type AddressLabel = "Home" | "Work" | "Other";

export type SavedAddress = {
  id: string;
  label: AddressLabel;
  customLabel: string;
  houseNumber: string;
  street: string;
  locality: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  instructions: string;
  coordinates: LocationPoint | null;
  isDefault: boolean;
};

export const EMPTY_ADDRESS: SavedAddress = {
  id: "",
  label: "Home",
  customLabel: "",
  houseNumber: "",
  street: "",
  locality: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  instructions: "",
  coordinates: null,
  isDefault: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCoordinates(value: unknown): value is LocationPoint {
  if (!isRecord(value)) return false;
  return (
    typeof value.latitude === "number" &&
    Number.isFinite(value.latitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    typeof value.longitude === "number" &&
    Number.isFinite(value.longitude) &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

function parseAddress(value: unknown): SavedAddress | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  const label = value.label;
  if (label !== "Home" && label !== "Work" && label !== "Other") return null;

  const stringValue = (key: string) =>
    typeof value[key] === "string" ? value[key] : "";
  const coordinates = value.coordinates;
  if (coordinates !== undefined && coordinates !== null && !isCoordinates(coordinates)) {
    return null;
  }

  return {
    id: value.id,
    label,
    customLabel: stringValue("customLabel"),
    houseNumber: stringValue("houseNumber"),
    street: stringValue("street"),
    locality: stringValue("locality"),
    landmark: stringValue("landmark"),
    city: stringValue("city"),
    state: stringValue("state"),
    pincode: stringValue("pincode"),
    phone: stringValue("phone"),
    instructions: stringValue("instructions"),
    coordinates: coordinates ?? null,
    isDefault: value.isDefault === true,
  };
}

function migrateLegacyAddress(value: unknown, index: number): SavedAddress | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  const address = typeof value.address === "string" ? value.address.trim() : "";
  if (!address) return null;
  const rawLabel = typeof value.label === "string" ? value.label.trim() : "";
  const normalizedLabel = rawLabel.toLowerCase();
  const label: AddressLabel =
    normalizedLabel === "home" || normalizedLabel === "work" ? rawLabel as AddressLabel : "Other";

  return {
    ...EMPTY_ADDRESS,
    id: value.id,
    label,
    customLabel: label === "Other" ? rawLabel : "",
    street: address,
    phone: typeof value.phone === "string" ? value.phone : "",
    instructions: typeof value.instructions === "string" ? value.instructions : "",
    isDefault: index === 0,
  };
}

function decodeArray(raw: string, parser: (value: unknown, index: number) => SavedAddress | null): SavedAddress[] {
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Saved addresses could not be read. Please review app storage.");
  }
  if (!Array.isArray(value)) {
    throw new Error("Saved addresses have an unsupported format.");
  }
  return value.map(parser).filter((address): address is SavedAddress => address !== null);
}

export function formatAddress(address: SavedAddress): string {
  if (address.street.trim() && !address.houseNumber.trim() && !address.locality.trim()) {
    return address.street.trim();
  }
  if (address.street.trim() && address.pincode.trim() && address.street.includes(address.pincode.trim())) return address.street.trim();
  return [
    address.houseNumber,
    address.street,
    address.locality,
    address.landmark ? `Near ${address.landmark}` : "",
    address.city,
    address.state,
    address.pincode,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function fromRemoteAddress(address: RemoteAddress): SavedAddress {
  const label = address.label.toLowerCase();
  const normalizedLabel: AddressLabel = label === "home" ? "Home" : label === "work" ? "Work" : "Other";
  const coordinates = typeof address.latitude === "number" && typeof address.longitude === "number"
    ? { latitude: address.latitude, longitude: address.longitude }
    : null;
  return {
    ...EMPTY_ADDRESS,
    id: String(address.id),
    label: normalizedLabel,
    customLabel: normalizedLabel === "Other" ? address.label : "",
    street: address.full_address,
    landmark: address.landmark ?? "",
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    coordinates,
    isDefault: address.is_default,
  };
}

function toRemoteAddress(address: SavedAddress): Omit<RemoteAddress, "id"> {
  return {
    label: address.label,
    full_address: formatAddress(address),
    landmark: address.landmark.trim() || null,
    city: address.city.trim(),
    state: address.state.trim(),
    pincode: address.pincode.trim(),
    latitude: address.coordinates?.latitude ?? null,
    longitude: address.coordinates?.longitude ?? null,
    is_default: address.isDefault,
  };
}

async function remoteAddressBookEnabled(): Promise<boolean> {
  return Boolean(await getAccessToken());
}

async function persistRemoteAddresses(): Promise<SavedAddress[]> {
  const addresses = (await fetchAddresses()).map(fromRemoteAddress);
  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));
  return addresses;
}

async function syncProfileAddress(address: SavedAddress): Promise<void> {
  const rawProfile = await AsyncStorage.getItem("lumina_profile");
  let profile: Record<string, unknown> = {};
  if (rawProfile) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawProfile) as unknown;
    } catch {
      throw new Error("Saved profile could not be read while updating the address.");
    }
    if (!isRecord(parsed)) {
      throw new Error("Saved profile has an unsupported format.");
    }
    profile = parsed;
  }
  await AsyncStorage.setItem(
    "lumina_profile",
    JSON.stringify({
      ...profile,
      address: formatAddress(address),
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      ...(address.phone ? { phone: address.phone } : {}),
    }),
  );
}

export async function loadAddresses(): Promise<SavedAddress[]> {
  if (await remoteAddressBookEnabled()) return persistRemoteAddresses();
  const stored = await AsyncStorage.getItem(ADDRESSES_KEY);
  if (stored !== null) return decodeArray(stored, (value) => parseAddress(value));

  const legacy = await AsyncStorage.getItem(LEGACY_ADDRESSES_KEY);
  if (legacy === null) return [];
  const migrated = decodeArray(legacy, migrateLegacyAddress);
  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(migrated));
  return migrated;
}

export async function saveAddress(address: SavedAddress): Promise<SavedAddress[]> {
  const remote = await remoteAddressBookEnabled();
  if (!formatAddress(address).trim() || !address.city.trim() || !address.state.trim() ||
      !/^\d{6}$/.test(address.pincode.trim())) {
    throw new Error("Enter a full address, city, state, and a valid 6-digit PIN code.");
  }
  if (!remote && (!address.houseNumber.trim() || !address.street.trim() || !address.locality.trim())) {
    throw new Error("Enter house or flat number, street, and locality.");
  }
  if (address.phone.trim() && !/^[6-9]\d{9}$/.test(address.phone.trim())) {
    throw new Error("Enter a valid 10-digit Indian mobile number.");
  }

  if (remote) {
    const payload = toRemoteAddress(address);
    if (/^\d+$/.test(address.id)) await updateAddress(Number(address.id), payload);
    else await createAddress(payload);
    return persistRemoteAddresses();
  }

  const existing = await loadAddresses();
  const isNew = !address.id;
  const saved = {
    ...address,
    id: address.id || `ADDR-${Date.now()}`,
    isDefault: address.isDefault || (isNew && existing.length === 0),
  };
  const next = existing.map((item) => ({
    ...item,
    isDefault: saved.isDefault ? false : item.isDefault,
  }));
  const index = next.findIndex((item) => item.id === saved.id);
  if (index >= 0) next[index] = saved;
  else next.unshift(saved);
  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(next));
  if (saved.isDefault) await setSelectedAddressId(saved.id);
  else if ((await getSelectedAddressId()) === saved.id) await syncProfileAddress(saved);
  return next;
}

export async function setDefaultAddress(id: string): Promise<SavedAddress[]> {
  if (await remoteAddressBookEnabled() && /^\d+$/.test(id)) {
    await makeAddressDefault(Number(id));
    const addresses = await persistRemoteAddresses();
    await setSelectedAddressId(id);
    return addresses;
  }
  const addresses = await loadAddresses();
  if (!addresses.some((address) => address.id === id)) {
    throw new Error("The selected saved address could not be found.");
  }
  const next = addresses.map((address) => ({ ...address, isDefault: address.id === id }));
  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(next));
  await setSelectedAddressId(id);
  return next;
}

export async function setSelectedAddressId(id: string): Promise<void> {
  const address = (await loadAddresses()).find((item) => item.id === id);
  if (!address) throw new Error("The selected saved address could not be found.");
  await AsyncStorage.setItem(SELECTED_ADDRESS_KEY, id);
  await syncProfileAddress(address);
}

export async function getSelectedAddressId(): Promise<string | null> {
  return AsyncStorage.getItem(SELECTED_ADDRESS_KEY);
}

export async function isAddressUsedByActiveDemoBooking(address: SavedAddress): Promise<boolean> {
  const { loadDemoBookings } = await import("@/lib/demo-store");
  const formatted = formatAddress(address).toLowerCase().replace(/\s+/g, " ").trim();
  const bookings = await loadDemoBookings();
  return bookings.some(
    (booking) => {
      if (booking.status !== "Confirmed") return false;
      const normalize = (value: string) =>
        value.toLowerCase().replace(/\s+/g, " ").trim();
      const bookingAddress = normalize(booking.address);
      const combinedAddress = normalize(
        `${booking.address}, ${booking.city}, ${booking.state}, ${booking.pincode}`,
      );
      return bookingAddress === formatted || combinedAddress === formatted;
    },
  );
}

async function isAddressUsedByDraftBooking(address: SavedAddress): Promise<boolean> {
  const [selectedId, rawCart] = await Promise.all([
    getSelectedAddressId(),
    AsyncStorage.getItem("lumina_cart"),
  ]);
  if (selectedId !== address.id || !rawCart) return false;

  let cart: unknown;
  try {
    cart = JSON.parse(rawCart) as unknown;
  } catch {
    throw new Error("The current draft cart could not be read before removing this address.");
  }
  if (!Array.isArray(cart)) {
    throw new Error("The current draft cart has an unsupported format.");
  }
  return cart.length > 0;
}

export async function deleteAddress(id: string): Promise<SavedAddress[]> {
  if (await remoteAddressBookEnabled() && /^\d+$/.test(id)) {
    const selectedId = await getSelectedAddressId();
    await removeAddress(Number(id));
    const next = await persistRemoteAddresses();
    if (selectedId === id) {
      const replacement = next.find((address) => address.isDefault) ?? next[0];
      if (replacement) {
        await setSelectedAddressId(replacement.id);
      } else {
        await AsyncStorage.removeItem(SELECTED_ADDRESS_KEY);
        const rawProfile = await AsyncStorage.getItem("lumina_profile");
        if (rawProfile) {
          let profile: unknown;
          try {
            profile = JSON.parse(rawProfile) as unknown;
          } catch {
            throw new Error("Saved profile could not be read while removing the address.");
          }
          if (!isRecord(profile)) {
            throw new Error("Saved profile has an unsupported format.");
          }
          const remaining = { ...profile };
          delete remaining.address;
          delete remaining.city;
          delete remaining.state;
          delete remaining.pincode;
          await AsyncStorage.setItem("lumina_profile", JSON.stringify(remaining));
        }
      }
    }
    return next;
  }
  const addresses = await loadAddresses();
  const address = addresses.find((item) => item.id === id);
  if (!address) throw new Error("The saved address could not be found.");
  if (await isAddressUsedByActiveDemoBooking(address)) {
    throw new Error("This address is used by an active demo booking. Cancel that booking before removing the address.");
  }
  if (await isAddressUsedByDraftBooking(address)) {
    throw new Error("This address is selected for a draft checkout. Change the selected address or clear the cart before removing it.");
  }

  const next = addresses.filter((item) => item.id !== id);
  if (address.isDefault && next.length > 0) next[0] = { ...next[0], isDefault: true };
  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(next));
  if ((await getSelectedAddressId()) === id) {
    if (next[0]) await setSelectedAddressId(next[0].id);
    else {
      await AsyncStorage.removeItem(SELECTED_ADDRESS_KEY);
      const rawProfile = await AsyncStorage.getItem("lumina_profile");
      if (rawProfile) {
        let profile: unknown;
        try {
          profile = JSON.parse(rawProfile) as unknown;
        } catch {
          throw new Error("Saved profile could not be read while removing the address.");
        }
        if (!isRecord(profile)) {
          throw new Error("Saved profile has an unsupported format.");
        }
        const remaining = { ...profile };
        delete remaining.address;
        delete remaining.city;
        delete remaining.state;
        delete remaining.pincode;
        await AsyncStorage.setItem("lumina_profile", JSON.stringify(remaining));
      }
    }
  }
  return next;
}
