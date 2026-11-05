export type PaymentMethod = "upi" | "card" | "netbanking" | "cash";

export type PaymentMethodOption = {
  id: PaymentMethod;
  label: string;
};

export type PaymentOptionsResult =
  | { status: "available"; methods: PaymentMethodOption[] }
  | { status: "unavailable"; message: string };

export type PaymentResult =
  | { status: "processing"; reference: string }
  | { status: "succeeded"; reference: string }
  | { status: "failed"; message: string };

export interface PaymentProvider {
  getSupportedMethods(): Promise<PaymentMethodOption[]>;
  startPayment(input: {
    amount: number;
    currency: "INR";
    method: PaymentMethod;
    bookingReference: string;
  }): Promise<PaymentResult>;
}

let provider: PaymentProvider | null = null;

export function configurePaymentProvider(configuredProvider: PaymentProvider): void {
  provider = configuredProvider;
}

export async function getPaymentOptions(): Promise<PaymentOptionsResult> {
  if (!provider) {
    return {
      status: "unavailable",
      message: "No payment provider is configured. No payment methods are currently available.",
    };
  }
  const methods = await provider.getSupportedMethods();
  return methods.length > 0
    ? { status: "available", methods }
    : {
        status: "unavailable",
        message: "The configured payment provider did not return any supported methods.",
      };
}

export async function startPayment(input: {
  amount: number;
  currency: "INR";
  method: PaymentMethod;
  bookingReference: string;
}): Promise<PaymentResult> {
  if (!provider) {
    throw new Error("No payment provider is configured. Payment cannot be started.");
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }
  if (!input.bookingReference.trim()) {
    throw new Error("A booking reference is required before starting payment.");
  }
  return provider.startPayment(input);
}
