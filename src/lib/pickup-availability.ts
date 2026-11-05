import type { SavedAddress } from "@/lib/address-book";
import { checkRemoteServiceability, fetchRemotePickupSlots } from "@/lib/laundry-api";

export type ServiceabilityResult =
  | { status: "serviceable"; message: string }
  | { status: "unsupported"; message: string }
  | { status: "unavailable"; message: string };

export type PickupSlot = {
  id: string;
  date: string;
  startsAt: string;
  endsAt: string;
  cutoffAt?: string;
};

export type PickupAvailabilityResult =
  | { status: "available"; slots: PickupSlot[] }
  | { status: "unavailable"; message: string };

export type ReschedulingEligibilityResult =
  | { status: "eligible"; deadline?: string }
  | { status: "ineligible"; message: string }
  | { status: "unavailable"; message: string };

export interface PickupAvailabilityProvider {
  checkServiceability(address: SavedAddress): Promise<ServiceabilityResult>;
  getAvailableSlots(
    address: SavedAddress,
    fromDate: string,
    toDate: string,
    vendorId?: number,
  ): Promise<PickupAvailabilityResult>;
  checkReschedulingEligibility(
    bookingReference: string,
  ): Promise<ReschedulingEligibilityResult>;
}

let provider: PickupAvailabilityProvider | null = null;

export function configurePickupAvailabilityProvider(
  configuredProvider: PickupAvailabilityProvider,
): void {
  provider = configuredProvider;
}

export async function checkServiceability(
  address: SavedAddress,
): Promise<ServiceabilityResult> {
  if (provider) return provider.checkServiceability(address);
  return checkRemoteServiceability(address.city, address.state, address.pincode);
}

export async function getAvailablePickupSlots(
  address: SavedAddress,
  fromDate: string,
  toDate: string,
  vendorId?: number,
): Promise<PickupAvailabilityResult> {
  if (provider) return provider.getAvailableSlots(address, fromDate, toDate, vendorId);
  if (!vendorId) return { status: "unavailable", message: "Select a valid laundry service before checking pickup slots." };
  const slots = await fetchRemotePickupSlots(vendorId, fromDate, toDate);
  return {
    status: slots.length > 0 ? "available" : "unavailable",
    message: slots.length > 0 ? "Pickup slots are available." : "No pickup slots are available in this date range.",
    ...(slots.length > 0 ? { slots: slots.map((slot) => ({ id: slot.id, date: slot.date, startsAt: slot.starts_at, endsAt: slot.ends_at })) } : {}),
  } as PickupAvailabilityResult;
}

export async function checkReschedulingEligibility(
  bookingReference: string,
): Promise<ReschedulingEligibilityResult> {
  if (!bookingReference.trim()) {
    throw new Error("A booking reference is required to check rescheduling eligibility.");
  }
  if (!provider) {
    return {
      status: "unavailable",
      message: "Rescheduling is not connected to a verified booking provider.",
    };
  }
  return provider.checkReschedulingEligibility(bookingReference);
}
