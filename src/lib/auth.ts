import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  apiRequest,
} from "@/lib/mobile-api";
import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
  secureTokenStorageAvailable,
} from "@/lib/token-storage";

export type AccountRole = "customer" | "admin" | "vendor" | "driver";

export type Account = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: AccountRole;
  status?: string | null;
};

type AuthResponse = {
  token: string;
  user: Account;
};

type CurrentAccountResponse = {
  user: Account;
};

const dashboardByRole: Record<AccountRole, string> = {
  customer: "/customer-dashboard",
  admin: "/admin",
  vendor: "/vendor",
  driver: "/driver",
};

async function persistAuth(
  response: AuthResponse,
  profileDetails: Record<string, string> = {},
): Promise<Account> {
  if (!response || typeof response.token !== "string" || !response.token || !isAccount(response.user)) {
    throw new Error("The server returned an invalid sign-in response.");
  }
  try {
    await saveAccessToken(response.token);
    await AsyncStorage.setItem(
      "lumina_profile",
      JSON.stringify({ ...response.user, ...profileDetails }),
    );
    await AsyncStorage.setItem(
      "lumina_mobile_session",
      JSON.stringify({ role: response.user.role }),
    );
    return response.user;
  } catch (error) {
    await clearAccessToken();
    throw error;
  }
}

export async function updateCustomerProfile(input: { name: string; phone: string }): Promise<Account> {
  const response = await apiRequest<{ user: Account }>('/api/mobile/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify({ name: input.name.trim(), phone: input.phone.trim() }),
  });
  if (!response?.user || !isAccount(response.user)) throw new Error('The server returned an invalid profile response.');
  await AsyncStorage.setItem('lumina_profile', JSON.stringify(response.user));
  return response.user;
}

function isAccount(value: unknown): value is Account {
  if (!value || typeof value !== "object") return false;
  const account = value as Record<string, unknown>;
  return typeof account.id === "number" && typeof account.name === "string" &&
    (typeof account.email === "string" || account.email === null) &&
    (typeof account.phone === "string" || account.phone === null) &&
    ["customer", "admin", "vendor", "driver"].includes(String(account.role));
}

export async function signIn(
  role: AccountRole,
  identity: string,
  password: string,
): Promise<Account> {
  if (!secureTokenStorageAvailable) {
    throw new Error("Sign-in is available in the installed mobile app.");
  }
  const response = await apiRequest<AuthResponse>("/api/mobile/auth/login", {
    method: "POST",
    body: JSON.stringify({ role, identity: identity.trim(), password }),
  });
  if (!response || !isAccount(response.user) || response.user.role !== role) {
    throw new Error("The server returned an account for a different workspace.");
  }
  return persistAuth(response);
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  address: string;
}): Promise<Account> {
  if (!secureTokenStorageAvailable) {
    throw new Error("Sign-in is available in the installed mobile app.");
  }
  const response = await apiRequest<AuthResponse>(
    "/api/mobile/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        password: input.password,
        password_confirmation: input.password,
      }),
    },
  );
  if (!response || !isAccount(response.user) || response.user.role !== "customer") {
    throw new Error("The server returned an account for a different workspace.");
  }
  return persistAuth(response, { address: input.address.trim() });
}

export async function registerVendor(input: {
  ownerName: string;
  shopName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
}): Promise<void> {
  if (!secureTokenStorageAvailable) {
    throw new Error("Partner applications are available in the installed mobile app.");
  }
  const response = await apiRequest<{
    message: string;
    application: { id: number; status: string };
  }>("/api/mobile/auth/vendor-register", {
    method: "POST",
    body: JSON.stringify({
      owner_name: input.ownerName.trim(),
      shop_name: input.shopName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      password: input.password,
      password_confirmation: input.password,
    }),
  });
  if (
    !response ||
    typeof response.message !== "string" ||
    !response.application ||
    typeof response.application.id !== "number" ||
    response.application.status !== "pending"
  ) {
    throw new Error("The server returned an invalid partner application response.");
  }
}

export async function getCurrentAccount(): Promise<Account | null> {
  if (!(await getAccessToken())) return null;

  const response = await apiRequest<CurrentAccountResponse>(
    "/api/mobile/auth/me",
  );
  if (!response || !isAccount(response.user)) {
    await clearAccessToken();
    await AsyncStorage.multiRemove(["lumina_profile", "lumina_mobile_session"]);
    throw new Error("The server returned an invalid session response.");
  }
  await AsyncStorage.setItem("lumina_profile", JSON.stringify(response.user));
  await AsyncStorage.setItem("lumina_mobile_session", JSON.stringify({ role: response.user.role }));
  return response.user;
}

export async function restoreSession(): Promise<Account | null> {
  try {
    return await getCurrentAccount();
  } catch (error) {
    if (error instanceof Error && /status 401/i.test(error.message)) return null;
    if (error instanceof Error && /status 403|account is not active/i.test(error.message)) {
      await clearAccessToken();
      await AsyncStorage.multiRemove(["lumina_profile", "lumina_mobile_session"]);
      return null;
    }
    throw error;
  }
}

export async function signOut(): Promise<void> {
  let requestFailed = false;
  let requestError: unknown;

  try {
    await apiRequest<{ message: string }>("/api/mobile/auth/logout", {
      method: "POST",
    });
  } catch (error) {
    requestFailed = true;
    requestError = error;
  }

  await clearAccessToken();
  await AsyncStorage.multiRemove(["lumina_profile", "lumina_mobile_session"]);

  if (requestFailed) {
    const message =
      requestError instanceof Error ? requestError.message : "Please try again.";
    throw new Error(`Signed out on this device, but the server sign-out failed: ${message}`);
  }
}

export function dashboardForRole(role: AccountRole): string {
  return dashboardByRole[role];
}
