import {
  clearAccessToken,
  getAccessToken,
} from "@/lib/token-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

type ApiErrorBody = {
  message?: unknown;
  errors?: unknown;
};

function getErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;

  const errorBody = body as ApiErrorBody;
  if (typeof errorBody.message === "string") return errorBody.message;

  if (errorBody.errors && typeof errorBody.errors === "object") {
    const firstError = Object.values(errorBody.errors).flat()[0];
    if (typeof firstError === "string") return firstError;
  }

  return fallback;
}

function getHttpErrorFallback(status: number, nonJson = false): string {
  if (status === 404) {
    return "The API route was not found (404). Verify the API URL and deploy the Laravel mobile routes.";
  }
  if (nonJson) {
    return `The server returned a non-JSON error response (HTTP ${status}).`;
  }
  return `Request failed with status ${status}.`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      "The API URL is not configured. Set EXPO_PUBLIC_API_URL in the app environment.",
    );
  }

  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(
    `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
    { ...options, headers },
  );
  if (response.status === 401) {
    await Promise.all([
      clearAccessToken(),
      AsyncStorage.multiRemove(["lumina_profile", "lumina_mobile_session"]),
    ]);
  }

  const responseText = await response.text();
  let body: unknown = null;

  if (responseText) {
    try {
      body = JSON.parse(responseText.replace(/^\uFEFF/, "").replace(/^\u00EF\u00BB\u00BF/, "")) as unknown;
    } catch {
      if (!response.ok) {
        throw new Error(getHttpErrorFallback(response.status, true));
      }
      throw new Error("The server returned an invalid response.");
    }
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(body, getHttpErrorFallback(response.status)),
    );
  }

  return body as T;
}
