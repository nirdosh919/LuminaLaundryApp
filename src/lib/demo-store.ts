import AsyncStorage from "@react-native-async-storage/async-storage";

export type DemoService = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  icon: string;
};

export const DEMO_SERVICES: DemoService[] = [
  {
    id: 1,
    name: "Wash & Fold",
    description: "Everyday laundry, washed and neatly folded.",
    category: "Laundry",
    price: 79,
    unit: "kg",
    icon: "◉",
  },
  {
    id: 2,
    name: "Dry Cleaning",
    description: "Care for garments that need a gentler clean.",
    category: "Specialist care",
    price: 99,
    unit: "item",
    icon: "✧",
  },
  {
    id: 3,
    name: "Steam Iron",
    description: "Crisp and wrinkle-free everyday favourites.",
    category: "Laundry",
    price: 15,
    unit: "item",
    icon: "≋",
  },
  {
    id: 4,
    name: "Shirt & Suit Care",
    description: "Considered care for shirts, suits and occasion wear.",
    category: "Specialist care",
    price: 199,
    unit: "item",
    icon: "◇",
  },
  {
    id: 5,
    name: "Shoe Cleaning",
    description: "A freshen-up for your everyday shoes.",
    category: "Specialist care",
    price: 249,
    unit: "pair",
    icon: "▱",
  },
];

export type DemoBookingItem = {
  serviceId: number;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type DemoBooking = {
  id: string;
  status: "Confirmed" | "Cancelled";
  createdAt: string;
  pickupDate: string;
  pickupTime: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  instructions: string;
  items: DemoBookingItem[];
  total: number;
  isDemo: true;
};

const BOOKINGS_KEY = "lumina_demo_bookings_v1";

function isDemoBookingItem(value: unknown): value is DemoBookingItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.serviceId === "number" &&
    typeof item.name === "string" &&
    Number.isInteger(item.quantity) &&
    typeof item.unitPrice === "number" &&
    Number.isFinite(item.unitPrice)
  );
}

function isDemoBooking(value: unknown): value is DemoBooking {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const booking = value as Record<string, unknown>;
  return (
    typeof booking.id === "string" &&
    (booking.status === "Confirmed" || booking.status === "Cancelled") &&
    typeof booking.createdAt === "string" &&
    typeof booking.pickupDate === "string" &&
    typeof booking.pickupTime === "string" &&
    typeof booking.customerName === "string" &&
    typeof booking.phone === "string" &&
    typeof booking.address === "string" &&
    typeof booking.city === "string" &&
    typeof booking.state === "string" &&
    typeof booking.pincode === "string" &&
    typeof booking.instructions === "string" &&
    Array.isArray(booking.items) &&
    booking.items.every(isDemoBookingItem) &&
    typeof booking.total === "number" &&
    Number.isFinite(booking.total) &&
    booking.isDemo === true
  );
}

export async function loadDemoBookings(): Promise<DemoBooking[]> {
  const stored = await AsyncStorage.getItem(BOOKINGS_KEY);
  if (stored === null) return [];

  let value: unknown;
  try {
    value = JSON.parse(stored) as unknown;
  } catch {
    throw new Error("Saved demo bookings could not be read. Clear app storage to reset them.");
  }
  if (!Array.isArray(value) || !value.every(isDemoBooking)) {
    throw new Error("Saved demo bookings have an unsupported format.");
  }
  return value;
}

export async function createDemoBooking(input: {
  customerName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  pickupDate: string;
  pickupTime: string;
  instructions: string;
  items: { serviceId: number; quantity: number }[];
}): Promise<DemoBooking> {
  if (input.items.length === 0) {
    throw new Error("Add at least one service before confirming a booking.");
  }

  const items = input.items.map(({ serviceId, quantity }) => {
    const service = DEMO_SERVICES.find((candidate) => candidate.id === serviceId);
    if (!service || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      throw new Error("A selected service or quantity is no longer available.");
    }
    return {
      serviceId: service.id,
      name: service.name,
      quantity,
      unitPrice: service.price,
    };
  });

  const booking: DemoBooking = {
    id: `DEMO-${Date.now()}`,
    status: "Confirmed",
    createdAt: new Date().toISOString(),
    pickupDate: input.pickupDate,
    pickupTime: input.pickupTime,
    customerName: input.customerName.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    pincode: input.pincode.trim(),
    instructions: input.instructions.trim(),
    items,
    total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    isDemo: true,
  };

  const existing = await loadDemoBookings();
  await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify([booking, ...existing]));
  return booking;
}

export async function cancelDemoBooking(id: string): Promise<DemoBooking[]> {
  const bookings = await loadDemoBookings();
  const booking = bookings.find((candidate) => candidate.id === id);
  if (!booking) throw new Error("This demo booking could not be found.");
  if (booking.status !== "Confirmed") {
    throw new Error("Only confirmed demo bookings can be cancelled.");
  }

  const updated = bookings.map((candidate) =>
    candidate.id === id ? { ...candidate, status: "Cancelled" as const } : candidate,
  );
  await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
  return updated;
}
